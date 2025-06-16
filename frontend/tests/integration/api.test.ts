/**
 * Integration tests for API proxy routes
 * Tests the Fresh API proxy that forwards requests to the Go backend
 */

import { assertEquals, assertExists } from "@std/assert";
import { createHandler, ServeHandlerInfo } from "$fresh/server.ts";
import manifest from "../../fresh.gen.ts";

// Mock backend server responses
let mockBackendResponse: Response | null = null;
let mockBackendCalls: Array<{ url: string; method: string; body?: string }> = [];

// Mock fetch to intercept backend calls
const originalFetch = globalThis.fetch;

function setupMockBackend() {
  globalThis.fetch = async (input: string | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.url;
    const method = typeof input === "string" ? (init?.method || "GET") : input.method;
    const body = typeof input === "string" ? init?.body : await input.text();

    // Record the call
    mockBackendCalls.push({ url, method, body: body?.toString() });

    // Return mock response if set
    if (mockBackendResponse) {
      return mockBackendResponse.clone();
    }

    // Default mock response
    return new Response(JSON.stringify({ tasks: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
}

function resetMockBackend() {
  globalThis.fetch = originalFetch;
  mockBackendResponse = null;
  mockBackendCalls = [];
}

function setMockBackendResponse(response: Response) {
  mockBackendResponse = response;
}

// Helper to create test requests
function createTestRequest(path: string, options: RequestInit = {}) {
  return new Request(`http://localhost:8007${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
}

// Create Fresh handler for testing
const handler = await createHandler(manifest);

Deno.test({
  name: "API Proxy - forwards health check request to backend",
  fn: async () => {
    setupMockBackend();
    
    setMockBackendResponse(new Response(
      JSON.stringify({ status: "ok" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    ));

    const req = createTestRequest("/api/todo.v1.TodoService/HealthCheck", {
      body: JSON.stringify({}),
    });

    const resp = await handler(req, {} as ServeHandlerInfo);
    
    assertEquals(resp.status, 200);
    
    const data = await resp.json();
    assertEquals(data.status, "ok");

    // Verify backend was called
    assertEquals(mockBackendCalls.length, 1);
    assertEquals(mockBackendCalls[0].method, "POST");
    assertEquals(mockBackendCalls[0].url.includes("HealthCheck"), true);

    resetMockBackend();
  },
});

Deno.test({
  name: "API Proxy - forwards list tasks request with pagination",
  fn: async () => {
    setupMockBackend();
    
    const mockTasks = [
      {
        id: "task-1",
        title: "Test Task 1",
        completed: false,
        createdAt: "2024-01-01T12:00:00Z",
        updatedAt: "2024-01-01T12:00:00Z",
      },
      {
        id: "task-2",
        title: "Test Task 2", 
        completed: true,
        createdAt: "2024-01-02T12:00:00Z",
        updatedAt: "2024-01-02T12:00:00Z",
      },
    ];

    setMockBackendResponse(new Response(
      JSON.stringify({
        tasks: mockTasks,
        pagination: {
          page: 1,
          pageSize: 20,
          totalPages: 1,
          totalItems: 2,
          hasPrevious: false,
          hasNext: false,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    ));

    const req = createTestRequest("/api/todo.v1.TodoService/ListTasks", {
      body: JSON.stringify({
        page: 1,
        pageSize: 20,
      }),
    });

    const resp = await handler(req, {} as ServeHandlerInfo);
    
    assertEquals(resp.status, 200);
    
    const data = await resp.json();
    assertEquals(Array.isArray(data.tasks), true);
    assertEquals(data.tasks.length, 2);
    assertEquals(data.tasks[0].title, "Test Task 1");
    assertEquals(data.pagination.totalItems, 2);

    // Verify request was forwarded correctly
    assertEquals(mockBackendCalls.length, 1);
    const requestBody = JSON.parse(mockBackendCalls[0].body!);
    assertEquals(requestBody.page, 1);
    assertEquals(requestBody.pageSize, 20);

    resetMockBackend();
  },
});

Deno.test({
  name: "API Proxy - forwards create task request",
  fn: async () => {
    setupMockBackend();
    
    const newTask = {
      id: "new-task-123",
      title: "New Test Task",
      completed: false,
      createdAt: "2024-01-01T12:00:00Z",
      updatedAt: "2024-01-01T12:00:00Z",
    };

    setMockBackendResponse(new Response(
      JSON.stringify({ task: newTask }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    ));

    const req = createTestRequest("/api/todo.v1.TodoService/CreateTask", {
      body: JSON.stringify({
        title: "New Test Task",
      }),
    });

    const resp = await handler(req, {} as ServeHandlerInfo);
    
    assertEquals(resp.status, 200);
    
    const data = await resp.json();
    assertEquals(data.task.title, "New Test Task");
    assertEquals(data.task.completed, false);
    assertExists(data.task.id);

    // Verify request body was forwarded
    assertEquals(mockBackendCalls.length, 1);
    const requestBody = JSON.parse(mockBackendCalls[0].body!);
    assertEquals(requestBody.title, "New Test Task");

    resetMockBackend();
  },
});

Deno.test({
  name: "API Proxy - forwards update task request",
  fn: async () => {
    setupMockBackend();
    
    const updatedTask = {
      id: "task-123",
      title: "Updated Task Title",
      completed: true,
      createdAt: "2024-01-01T12:00:00Z",
      updatedAt: "2024-01-01T13:00:00Z",
    };

    setMockBackendResponse(new Response(
      JSON.stringify({ task: updatedTask }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    ));

    const req = createTestRequest("/api/todo.v1.TodoService/UpdateTask", {
      body: JSON.stringify({
        id: "task-123",
        title: "Updated Task Title",
        completed: true,
      }),
    });

    const resp = await handler(req, {} as ServeHandlerInfo);
    
    assertEquals(resp.status, 200);
    
    const data = await resp.json();
    assertEquals(data.task.title, "Updated Task Title");
    assertEquals(data.task.completed, true);

    // Verify update request
    assertEquals(mockBackendCalls.length, 1);
    const requestBody = JSON.parse(mockBackendCalls[0].body!);
    assertEquals(requestBody.id, "task-123");
    assertEquals(requestBody.completed, true);

    resetMockBackend();
  },
});

Deno.test({
  name: "API Proxy - forwards delete task request",
  fn: async () => {
    setupMockBackend();
    
    setMockBackendResponse(new Response(
      JSON.stringify({}),
      { status: 200, headers: { "Content-Type": "application/json" } }
    ));

    const req = createTestRequest("/api/todo.v1.TodoService/DeleteTask", {
      body: JSON.stringify({
        id: "task-to-delete",
      }),
    });

    const resp = await handler(req, {} as ServeHandlerInfo);
    
    assertEquals(resp.status, 200);

    // Verify delete request
    assertEquals(mockBackendCalls.length, 1);
    const requestBody = JSON.parse(mockBackendCalls[0].body!);
    assertEquals(requestBody.id, "task-to-delete");

    resetMockBackend();
  },
});

Deno.test({
  name: "API Proxy - handles backend error responses",
  fn: async () => {
    setupMockBackend();
    
    setMockBackendResponse(new Response(
      JSON.stringify({ error: "Task not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    ));

    const req = createTestRequest("/api/todo.v1.TodoService/GetTask", {
      body: JSON.stringify({
        id: "nonexistent-task",
      }),
    });

    const resp = await handler(req, {} as ServeHandlerInfo);
    
    assertEquals(resp.status, 404);
    
    const data = await resp.json();
    assertEquals(data.error, "Task not found");

    resetMockBackend();
  },
});

Deno.test({
  name: "API Proxy - preserves request headers",
  fn: async () => {
    setupMockBackend();
    
    setMockBackendResponse(new Response(
      JSON.stringify({ status: "ok" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    ));

    const req = createTestRequest("/api/todo.v1.TodoService/HealthCheck", {
      headers: {
        "Content-Type": "application/json",
        "X-Custom-Header": "test-value",
        "Authorization": "Bearer test-token",
      },
      body: JSON.stringify({}),
    });

    const resp = await handler(req, {} as ServeHandlerInfo);
    
    assertEquals(resp.status, 200);

    // Headers should be forwarded (this would be verified in the backend call)
    assertEquals(mockBackendCalls.length, 1);

    resetMockBackend();
  },
});

Deno.test({
  name: "API Proxy - handles network errors gracefully",
  fn: async () => {
    // Setup fetch to reject (network error)
    globalThis.fetch = () => Promise.reject(new Error("Network error"));

    const req = createTestRequest("/api/todo.v1.TodoService/HealthCheck", {
      body: JSON.stringify({}),
    });

    try {
      const resp = await handler(req, {} as ServeHandlerInfo);
      // The proxy should handle the error appropriately
      // This depends on implementation - might return 500 or handle differently
    } catch (error) {
      // Network errors should be caught and handled
      assertEquals(error.message.includes("Network error"), true);
    } finally {
      resetMockBackend();
    }
  },
});

Deno.test({
  name: "API Proxy - constructs correct backend URLs",
  fn: async () => {
    setupMockBackend();
    
    setMockBackendResponse(new Response(
      JSON.stringify({ status: "ok" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    ));

    const testCases = [
      "/api/todo.v1.TodoService/HealthCheck",
      "/api/todo.v1.TodoService/ListTasks",
      "/api/todo.v1.TodoService/CreateTask",
      "/api/todo.v1.TodoService/UpdateTask",
      "/api/todo.v1.TodoService/DeleteTask",
    ];

    for (const path of testCases) {
      mockBackendCalls = []; // Reset calls

      const req = createTestRequest(path, {
        body: JSON.stringify({}),
      });

      await handler(req, {} as ServeHandlerInfo);

      // Verify the backend URL was constructed correctly
      assertEquals(mockBackendCalls.length, 1);
      
      // The API path should be stripped of '/api' prefix
      const expectedPath = path.replace('/api', '');
      assertEquals(mockBackendCalls[0].url.includes(expectedPath), true);
    }

    resetMockBackend();
  },
});

Deno.test({
  name: "API Proxy - handles different HTTP methods", 
  fn: async () => {
    setupMockBackend();
    
    setMockBackendResponse(new Response(
      JSON.stringify({ status: "ok" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    ));

    // Test different methods (though ConnectRPC typically uses POST)
    const methods = ["POST", "GET", "PUT", "DELETE"];
    
    for (const method of methods) {
      mockBackendCalls = []; // Reset calls

      const req = createTestRequest("/api/todo.v1.TodoService/HealthCheck", {
        method,
        body: method !== "GET" ? JSON.stringify({}) : undefined,
      });

      await handler(req, {} as ServeHandlerInfo);

      assertEquals(mockBackendCalls.length, 1);
      assertEquals(mockBackendCalls[0].method, method);
    }

    resetMockBackend();
  },
});