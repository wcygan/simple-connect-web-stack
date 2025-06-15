#!/usr/bin/env -S deno run --allow-net --allow-run

/**
 * Test script to verify the ConnectRPC integration works end-to-end
 */

import { $ } from "@david/dax";

console.log("🔧 Testing ConnectRPC stack integration...");

// Test health check endpoint directly
console.log("\n📡 Testing backend health check...");

try {
  const healthResponse = await fetch("http://localhost:3000/todo.v1.TodoService/HealthCheck", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (healthResponse.ok) {
    const healthData = await healthResponse.json();
    console.log("✅ Backend health check:", healthData);
  } else {
    console.log("❌ Backend health check failed:", healthResponse.status);
    console.log("Response:", await healthResponse.text());
  }
} catch (error) {
  console.log("⚠️  Backend not running or unreachable:", error.message);
  console.log("💡 Make sure to run 'cd backend && go run ./cmd/server' first");
}

// Test creating a task
console.log("\n📝 Testing task creation...");

try {
  const createResponse = await fetch("http://localhost:3000/todo.v1.TodoService/CreateTask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "Test task from script"
    }),
  });

  if (createResponse.ok) {
    const taskData = await createResponse.json();
    console.log("✅ Task created:", taskData);

    // Test listing tasks
    console.log("\n📋 Testing task listing...");
    const listResponse = await fetch("http://localhost:3000/todo.v1.TodoService/ListTasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page: 1,
        pageSize: 10
      }),
    });

    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log("✅ Tasks listed:", listData.tasks?.length || 0, "tasks found");
    } else {
      console.log("❌ Task listing failed:", listResponse.status);
    }

  } else {
    console.log("❌ Task creation failed:", createResponse.status);
    console.log("Response:", await createResponse.text());
  }
} catch (error) {
  console.log("⚠️  Task creation test failed:", error.message);
}

console.log("\n🎯 Test complete!");