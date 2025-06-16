#!/usr/bin/env -S deno run --allow-all

/**
 * ConnectRPC Integration Test Suite
 * Tests the full stack communication between frontend and backend
 */

import { assertEquals, assertExists, assertMatch } from "@std/assert";
import { delay } from "@std/async";

interface TestTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TestResponse<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

class ConnectRPCTestClient {
  private baseUrl: string;

  constructor(baseUrl = "http://localhost:30071") {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    method: string,
    data: unknown = {}
  ): Promise<TestResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}/todo.v1.TodoService/${method}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      return {
        ok: response.ok,
        status: response.status,
        data: response.ok ? responseData : undefined,
        error: !response.ok ? responseData.message || "Unknown error" : undefined,
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        error: error.message,
      };
    }
  }

  async healthCheck() {
    return this.makeRequest<{ status: string }>("HealthCheck", {});
  }

  async listTasks(options: {
    page?: number;
    pageSize?: number;
    query?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    return this.makeRequest<{
      tasks: TestTask[];
      pagination: {
        page: number;
        pageSize: number;
        totalPages: number;
        totalItems: number;
        hasPrevious: boolean;
        hasNext: boolean;
      };
    }>("ListTasks", {
      page: options.page || 1,
      pageSize: options.pageSize || 20,
      query: options.query || "",
      status: options.status || "STATUS_FILTER_ALL",
      sortBy: options.sortBy || "SORT_FIELD_CREATED_AT",
      sortOrder: options.sortOrder || "SORT_ORDER_DESC",
    });
  }

  async createTask(title: string) {
    return this.makeRequest<{ task: TestTask }>("CreateTask", { title });
  }

  async getTask(id: string) {
    return this.makeRequest<{ task: TestTask }>("GetTask", { id });
  }

  async updateTask(id: string, title?: string, completed?: boolean) {
    const updateData: any = { id };
    if (title !== undefined) updateData.title = title;
    if (completed !== undefined) updateData.completed = completed;
    
    return this.makeRequest<{ task: TestTask }>("UpdateTask", updateData);
  }

  async deleteTask(id: string) {
    return this.makeRequest("DeleteTask", { id });
  }
}

async function waitForBackend(client: ConnectRPCTestClient, maxRetries = 30): Promise<boolean> {
  console.log("🔄 Waiting for backend to be ready...");
  
  for (let i = 0; i < maxRetries; i++) {
    const result = await client.healthCheck();
    if (result.ok) {
      console.log("✅ Backend is ready!");
      return true;
    }
    
    if (i < maxRetries - 1) {
      await delay(2000); // Wait 2 seconds
    }
  }
  
  console.log("❌ Backend failed to start within timeout");
  return false;
}

async function runIntegrationTests() {
  console.log("🚀 Starting ConnectRPC Integration Tests\n");

  const client = new ConnectRPCTestClient();
  let testsRan = 0;
  let testsPassed = 0;
  const testResults: Array<{ name: string; passed: boolean; error?: string }> = [];

  // Helper function to run a test
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

  // Wait for backend to be ready
  if (!(await waitForBackend(client))) {
    console.log("💥 Cannot proceed without backend");
    Deno.exit(1);
  }

  console.log("\n📋 Running Integration Tests...\n");

  // Test 1: Health Check
  await runTest("Health Check", async () => {
    const result = await client.healthCheck();
    assertEquals(result.ok, true);
    assertEquals(result.data?.status, "ok");
  });

  // Test 2: List Tasks (empty initially)
  await runTest("List Tasks - Empty State", async () => {
    const result = await client.listTasks();
    assertEquals(result.ok, true);
    assertEquals(Array.isArray(result.data?.tasks), true);
    assertEquals(result.data?.pagination.page, 1);
    assertEquals(result.data?.pagination.pageSize, 20);
  });

  // Test 3: Create Task
  let createdTaskId: string = "";
  await runTest("Create Task", async () => {
    const result = await client.createTask("Integration Test Task");
    assertEquals(result.ok, true);
    assertExists(result.data?.task);
    assertEquals(result.data?.task.title, "Integration Test Task");
    assertEquals(result.data?.task.completed, false);
    assertExists(result.data?.task.id);
    
    createdTaskId = result.data!.task.id;
  });

  // Test 4: Get Task by ID
  await runTest("Get Task by ID", async () => {
    const result = await client.getTask(createdTaskId);
    assertEquals(result.ok, true);
    assertEquals(result.data?.task.id, createdTaskId);
    assertEquals(result.data?.task.title, "Integration Test Task");
  });

  // Test 5: Update Task Title
  await runTest("Update Task Title", async () => {
    const result = await client.updateTask(createdTaskId, "Updated Integration Task");
    assertEquals(result.ok, true);
    assertEquals(result.data?.task.title, "Updated Integration Task");
    assertEquals(result.data?.task.completed, false);
  });

  // Test 6: Update Task Completion Status
  await runTest("Update Task Completion", async () => {
    const result = await client.updateTask(createdTaskId, undefined, true);
    assertEquals(result.ok, true);
    assertEquals(result.data?.task.completed, true);
  });

  // Test 7: List Tasks with Filters
  await runTest("List Tasks with Completed Filter", async () => {
    const result = await client.listTasks({ 
      status: "STATUS_FILTER_COMPLETED" 
    });
    assertEquals(result.ok, true);
    assertEquals(result.data?.tasks.length! >= 1, true);
    
    // All returned tasks should be completed
    result.data?.tasks.forEach(task => {
      assertEquals(task.completed, true);
    });
  });

  // Test 8: List Tasks with Search Query
  await runTest("List Tasks with Search Query", async () => {
    const result = await client.listTasks({ 
      query: "Updated Integration" 
    });
    assertEquals(result.ok, true);
    assertEquals(result.data?.tasks.length! >= 1, true);
    
    // Should find our updated task
    const foundTask = result.data?.tasks.find(t => t.id === createdTaskId);
    assertExists(foundTask);
    assertEquals(foundTask.title, "Updated Integration Task");
  });

  // Test 9: List Tasks with Pagination
  await runTest("List Tasks with Pagination", async () => {
    // Create a few more tasks for pagination testing
    await client.createTask("Pagination Test Task 1");
    await client.createTask("Pagination Test Task 2");
    await client.createTask("Pagination Test Task 3");

    const result = await client.listTasks({ 
      page: 1, 
      pageSize: 2 
    });
    assertEquals(result.ok, true);
    assertEquals(result.data?.tasks.length, 2);
    assertEquals(result.data?.pagination.pageSize, 2);
    assertEquals(result.data?.pagination.totalItems! >= 4, true);
  });

  // Test 10: Error Handling - Get Non-existent Task
  await runTest("Error Handling - Non-existent Task", async () => {
    const result = await client.getTask("non-existent-id");
    assertEquals(result.ok, false);
    assertEquals(result.status, 404);
    assertExists(result.error);
  });

  // Test 11: Error Handling - Invalid Create Request
  await runTest("Error Handling - Empty Task Title", async () => {
    const result = await client.createTask("");
    assertEquals(result.ok, false);
    assertEquals(result.status, 400);
    assertExists(result.error);
  });

  // Test 12: Error Handling - Invalid Update Request
  await runTest("Error Handling - Update Non-existent Task", async () => {
    const result = await client.updateTask("non-existent-id", "New Title");
    assertEquals(result.ok, false);
    assertEquals(result.status, 404);
    assertExists(result.error);
  });

  // Test 13: Delete Task
  await runTest("Delete Task", async () => {
    const result = await client.deleteTask(createdTaskId);
    assertEquals(result.ok, true);
    
    // Verify task is deleted
    const getResult = await client.getTask(createdTaskId);
    assertEquals(getResult.ok, false);
    assertEquals(getResult.status, 404);
  });

  // Test 14: End-to-End Workflow
  await runTest("End-to-End Workflow", async () => {
    // Create task
    const createResult = await client.createTask("E2E Workflow Task");
    assertEquals(createResult.ok, true);
    const taskId = createResult.data!.task.id;

    // Read task
    const getResult = await client.getTask(taskId);
    assertEquals(getResult.ok, true);
    assertEquals(getResult.data?.task.title, "E2E Workflow Task");

    // Update task
    const updateResult = await client.updateTask(taskId, "Updated E2E Task", true);
    assertEquals(updateResult.ok, true);
    assertEquals(updateResult.data?.task.completed, true);

    // List and verify
    const listResult = await client.listTasks({ query: "Updated E2E" });
    assertEquals(listResult.ok, true);
    const foundTask = listResult.data?.tasks.find(t => t.id === taskId);
    assertExists(foundTask);

    // Delete task
    const deleteResult = await client.deleteTask(taskId);
    assertEquals(deleteResult.ok, true);
  });

  // Test 15: Concurrent Operations
  await runTest("Concurrent Operations", async () => {
    const promises = [];
    
    // Create multiple tasks concurrently
    for (let i = 0; i < 5; i++) {
      promises.push(client.createTask(`Concurrent Task ${i + 1}`));
    }
    
    const results = await Promise.all(promises);
    
    // All should succeed
    results.forEach((result, index) => {
      assertEquals(result.ok, true, `Concurrent task ${index + 1} failed`);
      assertEquals(result.data?.task.title, `Concurrent Task ${index + 1}`);
    });

    // Clean up
    const cleanupPromises = results.map(result => 
      client.deleteTask(result.data!.task.id)
    );
    await Promise.allSettled(cleanupPromises);
  });

  // Print Results
  console.log("\n" + "=".repeat(60));
  console.log("📊 INTEGRATION TEST RESULTS");
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

  console.log(`\n🎯 Integration tests completed!`);
  
  if (testsPassed === testsRan) {
    console.log("🎉 All tests passed!");
    Deno.exit(0);
  } else {
    console.log("💥 Some tests failed!");
    Deno.exit(1);
  }
}

// Run the tests
if (import.meta.main) {
  await runIntegrationTests();
}