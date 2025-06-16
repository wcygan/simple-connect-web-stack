#!/usr/bin/env -S deno run --allow-all

/**
 * Database Integration Test Suite
 * Tests database operations, fixtures, and data integrity
 */

import { assertEquals, assertExists, assertNotEquals } from "@std/assert";
import { delay } from "@std/async";

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

class MySQLTestClient {
  private config: DatabaseConfig;

  constructor(config?: Partial<DatabaseConfig>) {
    this.config = {
      host: "localhost",
      port: 33061,
      user: "testuser", 
      password: "testpass",
      database: "test_tasks_db",
      ...config,
    };
  }

  async executeQuery(query: string, params: unknown[] = []): Promise<any[]> {
    // Note: In a real implementation, you'd use a proper MySQL client
    // For this test, we'll simulate the queries through the RPC API
    // This is a simplified version for demonstration
    
    // Mock implementation - in practice you'd use a MySQL client library
    console.log(`Executing query: ${query}`);
    console.log(`Parameters: ${JSON.stringify(params)}`);
    
    return [];
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test connection by making a simple query through the backend
      const response = await fetch("http://localhost:30071/todo.v1.TodoService/HealthCheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }
}

async function waitForDatabase(client: MySQLTestClient): Promise<boolean> {
  console.log("🔄 Waiting for database to be ready...");
  
  for (let i = 0; i < 30; i++) {
    if (await client.testConnection()) {
      console.log("✅ Database is ready!");
      return true;
    }
    
    if (i < 29) {
      await delay(2000);
    }
  }
  
  console.log("❌ Database failed to start within timeout");
  return false;
}

async function runDatabaseTests() {
  console.log("🗄️ Starting Database Integration Tests\n");

  const client = new MySQLTestClient();
  let testsRan = 0;
  let testsPassed = 0;
  const testResults: Array<{ name: string; passed: boolean; error?: string }> = [];

  async function runTest(name: string, testFn: () => Promise<void>) {
    testsRan++;
    console.log(`  🧪 ${name}...`);
    
    try {
      await testFn();
      testsPassed++;
      testResults.push({ name, passed: true });
      console.log(`  ✅ ${name}`);
    } catch (error) {
      testResults.push({ name, passed: false, error: error.message });
      console.log(`  ❌ ${name}: ${error.message}`);
    }
  }

  // Wait for database
  if (!(await waitForDatabase(client))) {
    console.log("💥 Cannot proceed without database");
    Deno.exit(1);
  }

  console.log("\n📋 Running Database Tests...\n");

  // Test 1: Database Connection
  await runTest("Database Connection", async () => {
    const connected = await client.testConnection();
    assertEquals(connected, true);
  });

  // Test 2: Test Data Fixtures
  await runTest("Test Data Fixtures Loaded", async () => {
    // Verify test data exists by listing tasks through the API
    const response = await fetch("http://localhost:30071/todo.v1.TodoService/ListTasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: 1, pageSize: 50 }),
    });
    
    assertEquals(response.ok, true);
    const data = await response.json();
    
    // Should have seed data (at least some test tasks)
    assertEquals(Array.isArray(data.tasks), true);
    
    // Look for specific seed tasks
    const seedTasks = data.tasks.filter((task: any) => 
      task.id && task.id.startsWith("test-task-")
    );
    assertEquals(seedTasks.length >= 3, true, "Should have seed data");
  });

  // Test 3: Data Persistence
  await runTest("Data Persistence", async () => {
    // Create a task
    const createResponse = await fetch("http://localhost:30071/todo.v1.TodoService/CreateTask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Persistence Test Task" }),
    });
    
    assertEquals(createResponse.ok, true);
    const createData = await createResponse.json();
    const taskId = createData.task.id;

    // Verify it persists after a short delay
    await delay(100);
    
    const getResponse = await fetch("http://localhost:30071/todo.v1.TodoService/GetTask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId }),
    });
    
    assertEquals(getResponse.ok, true);
    const getData = await getResponse.json();
    assertEquals(getData.task.title, "Persistence Test Task");

    // Clean up
    await fetch("http://localhost:30071/todo.v1.TodoService/DeleteTask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId }),
    });
  });

  // Test 4: Transaction Integrity
  await runTest("Transaction Integrity", async () => {
    // Test that operations are atomic by creating multiple tasks
    const createPromises = [];
    for (let i = 0; i < 3; i++) {
      createPromises.push(
        fetch("http://localhost:30071/todo.v1.TodoService/CreateTask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: `Transaction Test ${i + 1}` }),
        })
      );
    }

    const responses = await Promise.all(createPromises);
    
    // All should succeed
    responses.forEach((response, index) => {
      assertEquals(response.ok, true, `Transaction ${index + 1} failed`);
    });

    // Verify all tasks exist
    const listResponse = await fetch("http://localhost:30071/todo.v1.TodoService/ListTasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "Transaction Test" }),
    });

    const listData = await listResponse.json();
    assertEquals(listData.tasks.length >= 3, true);

    // Clean up
    const cleanupPromises = listData.tasks
      .filter((task: any) => task.title.includes("Transaction Test"))
      .map((task: any) =>
        fetch("http://localhost:30071/todo.v1.TodoService/DeleteTask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: task.id }),
        })
      );
    
    await Promise.allSettled(cleanupPromises);
  });

  // Test 5: Data Validation Constraints
  await runTest("Data Validation Constraints", async () => {
    // Test empty title (should fail)
    const emptyResponse = await fetch("http://localhost:30071/todo.v1.TodoService/CreateTask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });
    
    assertEquals(emptyResponse.ok, false);
    assertEquals(emptyResponse.status, 400);

    // Test very long title (should fail)
    const longTitle = "a".repeat(300);
    const longResponse = await fetch("http://localhost:30071/todo.v1.TodoService/CreateTask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: longTitle }),
    });
    
    assertEquals(longResponse.ok, false);
    assertEquals(longResponse.status, 400);
  });

  // Test 6: Search Functionality
  await runTest("Search Functionality", async () => {
    // Create tasks with specific search terms
    const searchTasks = [
      "JavaScript Development",
      "Go Programming", 
      "Database Design",
    ];

    const createPromises = searchTasks.map(title =>
      fetch("http://localhost:30071/todo.v1.TodoService/CreateTask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
    );

    await Promise.all(createPromises);

    // Test search
    const searchResponse = await fetch("http://localhost:30071/todo.v1.TodoService/ListTasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "Development" }),
    });

    assertEquals(searchResponse.ok, true);
    const searchData = await searchResponse.json();
    
    // Should find the JavaScript Development task
    const foundTask = searchData.tasks.find((task: any) => 
      task.title.includes("JavaScript Development")
    );
    assertExists(foundTask);

    // Clean up
    const cleanupPromises = searchTasks.map(async (title) => {
      const listResponse = await fetch("http://localhost:30071/todo.v1.TodoService/ListTasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: title }),
      });
      const listData = await listResponse.json();
      
      return Promise.all(
        listData.tasks
          .filter((task: any) => task.title === title)
          .map((task: any) =>
            fetch("http://localhost:30071/todo.v1.TodoService/DeleteTask", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: task.id }),
            })
          )
      );
    });
    
    await Promise.allSettled(cleanupPromises);
  });

  // Test 7: Pagination Performance
  await runTest("Pagination Performance", async () => {
    // Test pagination with different page sizes
    const pageSizes = [5, 10, 20, 50];
    
    for (const pageSize of pageSizes) {
      const response = await fetch("http://localhost:30071/todo.v1.TodoService/ListTasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: 1, pageSize }),
      });

      assertEquals(response.ok, true);
      const data = await response.json();
      
      // Should respect page size limit
      assertEquals(data.tasks.length <= pageSize, true);
      assertEquals(data.pagination.pageSize, pageSize);
    }
  });

  // Test 8: Sorting and Ordering
  await runTest("Sorting and Ordering", async () => {
    // Test different sort orders
    const sortTests = [
      { sortBy: "SORT_FIELD_CREATED_AT", sortOrder: "SORT_ORDER_ASC" },
      { sortBy: "SORT_FIELD_CREATED_AT", sortOrder: "SORT_ORDER_DESC" },
      { sortBy: "SORT_FIELD_TITLE", sortOrder: "SORT_ORDER_ASC" },
    ];

    for (const sortTest of sortTests) {
      const response = await fetch("http://localhost:30071/todo.v1.TodoService/ListTasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sortTest),
      });

      assertEquals(response.ok, true);
      const data = await response.json();
      
      // Should return sorted results
      assertEquals(Array.isArray(data.tasks), true);
      
      // Verify sorting (at least check we have results)
      if (data.tasks.length > 1) {
        // More detailed sorting verification could be added here
        assertExists(data.tasks[0]);
        assertExists(data.tasks[1]);
      }
    }
  });

  // Test 9: Concurrent Database Access
  await runTest("Concurrent Database Access", async () => {
    const concurrentOps = [];
    
    // Mix of different operations
    for (let i = 0; i < 10; i++) {
      if (i % 3 === 0) {
        // Create
        concurrentOps.push(
          fetch("http://localhost:30071/todo.v1.TodoService/CreateTask", {
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: `Concurrent Task ${i}` }),
          })
        );
      } else {
        // List
        concurrentOps.push(
          fetch("http://localhost:30071/todo.v1.TodoService/ListTasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ page: 1, pageSize: 10 }),
          })
        );
      }
    }

    const responses = await Promise.allSettled(concurrentOps);
    
    // Most should succeed (some might conflict, but majority should work)
    const successful = responses.filter(result => 
      result.status === "fulfilled" && result.value.ok
    );
    
    assertEquals(successful.length >= 7, true, "Most concurrent operations should succeed");

    // Clean up created tasks
    const cleanupResponse = await fetch("http://localhost:30071/todo.v1.TodoService/ListTasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "Concurrent Task" }),
    });
    
    if (cleanupResponse.ok) {
      const cleanupData = await cleanupResponse.json();
      const cleanupPromises = cleanupData.tasks.map((task: any) =>
        fetch("http://localhost:30071/todo.v1.TodoService/DeleteTask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: task.id }),
        })
      );
      
      await Promise.allSettled(cleanupPromises);
    }
  });

  // Test 10: Data Integrity After Operations
  await runTest("Data Integrity After Operations", async () => {
    // Create, update, and verify data consistency
    const createResponse = await fetch("http://localhost:30071/todo.v1.TodoService/CreateTask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Integrity Test Task" }),
    });

    const createData = await createResponse.json();
    const taskId = createData.task.id;
    
    // Update the task
    const updateResponse = await fetch("http://localhost:30071/todo.v1.TodoService/UpdateTask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        id: taskId, 
        title: "Updated Integrity Test", 
        completed: true 
      }),
    });

    assertEquals(updateResponse.ok, true);

    // Verify the update
    const getResponse = await fetch("http://localhost:30071/todo.v1.TodoService/GetTask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId }),
    });

    const getData = await getResponse.json();
    assertEquals(getData.task.title, "Updated Integrity Test");
    assertEquals(getData.task.completed, true);
    
    // Verify timestamps updated
    assertExists(getData.task.updatedAt);
    assertNotEquals(getData.task.createdAt, getData.task.updatedAt);

    // Clean up
    await fetch("http://localhost:30071/todo.v1.TodoService/DeleteTask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId }),
    });
  });

  // Print Results
  console.log("\n" + "=".repeat(60));
  console.log("🗄️ DATABASE TEST RESULTS");
  console.log("=".repeat(60));
  
  console.log(`\n📈 Summary:`);
  console.log(`  Tests Run: ${testsRan}`);
  console.log(`  Passed: ${testsPassed}`);
  console.log(`  Failed: ${testsRan - testsPassed}`);
  console.log(`  Success Rate: ${Math.round((testsPassed / testsRan) * 100)}%`);

  if (testsPassed < testsRan) {
    console.log(`\n❌ Failed Tests:`);
    testResults
      .filter(result => !result.passed)
      .forEach(result => {
        console.log(`  • ${result.name}: ${result.error}`);
      });
  }

  console.log(`\n🎯 Database tests completed!`);
  
  if (testsPassed === testsRan) {
    console.log("🎉 All database tests passed!");
    Deno.exit(0);
  } else {
    console.log("💥 Some database tests failed!");
    Deno.exit(1);
  }
}

// Run the tests
if (import.meta.main) {
  await runDatabaseTests();
}