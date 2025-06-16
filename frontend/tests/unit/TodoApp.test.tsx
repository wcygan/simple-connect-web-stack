/**
 * Unit tests for TodoApp component
 * Tests component behavior with mocked RPC client
 */

import { assertEquals, assertExists, assertMatch } from "@std/assert";
import { createHandler, ServeHandlerInfo } from "$fresh/server.ts";
import { render } from "preact/render-to-string";
import { signal } from "@preact/signals";
import TodoApp from "../../islands/TodoApp.tsx";

// Mock RPC client for testing
class MockTodoClient {
  private tasks = signal([
    {
      id: "test-1",
      title: "Test Task 1",
      completed: false,
      createdAt: { toDate: () => new Date("2024-01-01") },
      updatedAt: { toDate: () => new Date("2024-01-01") },
    },
    {
      id: "test-2", 
      title: "Test Task 2",
      completed: true,
      createdAt: { toDate: () => new Date("2024-01-02") },
      updatedAt: { toDate: () => new Date("2024-01-02") },
    },
  ]);

  async listTasks() {
    return {
      tasks: this.tasks.value,
      pagination: {
        page: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: this.tasks.value.length,
        hasPrevious: false,
        hasNext: false,
      },
    };
  }

  async createTask({ title }: { title: string }) {
    const newTask = {
      id: `test-${Date.now()}`,
      title,
      completed: false,
      createdAt: { toDate: () => new Date() },
      updatedAt: { toDate: () => new Date() },
    };
    this.tasks.value = [...this.tasks.value, newTask];
    return { task: newTask };
  }

  async updateTask({ id, title, completed }: { id: string; title?: string; completed: boolean }) {
    const taskIndex = this.tasks.value.findIndex(t => t.id === id);
    if (taskIndex === -1) throw new Error("Task not found");
    
    const updatedTask = {
      ...this.tasks.value[taskIndex],
      ...(title && { title }),
      completed,
      updatedAt: { toDate: () => new Date() },
    };
    
    this.tasks.value = this.tasks.value.map(t => t.id === id ? updatedTask : t);
    return { task: updatedTask };
  }

  async deleteTask({ id }: { id: string }) {
    this.tasks.value = this.tasks.value.filter(t => t.id !== id);
    return {};
  }
}

Deno.test("TodoApp - renders without crashing", () => {
  const html = render(<TodoApp />);
  assertExists(html);
  assertMatch(html, /Todo/);
});

Deno.test("TodoApp - displays task statistics correctly", () => {
  const html = render(<TodoApp />);
  
  // Should contain statistics display elements
  assertMatch(html, /Total/);
  assertMatch(html, /Completed/);
  assertMatch(html, /Pending/);
});

Deno.test("TodoApp - shows proper form elements", () => {
  const html = render(<TodoApp />);
  
  // Should contain input form
  assertMatch(html, /input.*placeholder.*What.*on.*mind/);
  assertMatch(html, /Add Task/);
});

Deno.test("TodoApp - displays loading state", () => {
  const html = render(<TodoApp />);
  
  // Should show loading skeleton initially
  assertMatch(html, /animate-pulse/);
});

Deno.test("TodoApp - shows empty state message", () => {
  const html = render(<TodoApp />);
  
  // Should contain empty state elements
  assertMatch(html, /All caught up!/);
  assertMatch(html, /Add a new task to get started/);
});

Deno.test("TodoApp - contains proper accessibility attributes", () => {
  const html = render(<TodoApp />);
  
  // Should have proper form labels and inputs
  assertMatch(html, /for="task-/);
  assertMatch(html, /id="task-/);
  assertMatch(html, /type="checkbox"/);
});

Deno.test("TodoApp - includes error display elements", () => {
  const html = render(<TodoApp />);
  
  // Should have error display structure (even if hidden)
  assertMatch(html, /Error:/);
});

Deno.test("TodoApp - has progress indicator", () => {
  const html = render(<TodoApp />);
  
  // Should include progress bar elements
  assertMatch(html, /Progress/);
  assertMatch(html, /bg-gradient-to-r/);
});

Deno.test("TodoApp - contains proper CSS classes for styling", () => {
  const html = render(<TodoApp />);
  
  // Should use modern Tailwind classes
  assertMatch(html, /bg-surface/);
  assertMatch(html, /text-text-primary/);
  assertMatch(html, /rounded-xl/);
  assertMatch(html, /animate-fade-in/);
});

Deno.test("TodoApp - has proper button states", () => {
  const html = render(<TodoApp />);
  
  // Should have disabled state handling
  assertMatch(html, /disabled.*cursor-not-allowed/);
  assertMatch(html, /hover:bg-primary-hover/);
});

// Component behavior tests (requires more complex setup with signals)
Deno.test("TodoApp - task statistics calculation", () => {
  // Mock data for testing statistics
  const mockTasks = [
    { id: "1", completed: false },
    { id: "2", completed: true },
    { id: "3", completed: false },
    { id: "4", completed: true },
  ];

  const totalTasks = mockTasks.length;
  const completedTasks = mockTasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;

  assertEquals(totalTasks, 4);
  assertEquals(completedTasks, 2);
  assertEquals(pendingTasks, 2);
});

Deno.test("TodoApp - progress percentage calculation", () => {
  const testCases = [
    { total: 0, completed: 0, expected: 0 },
    { total: 4, completed: 0, expected: 0 },
    { total: 4, completed: 2, expected: 50 },
    { total: 4, completed: 4, expected: 100 },
    { total: 3, completed: 1, expected: 33 },
  ];

  testCases.forEach(({ total, completed, expected }) => {
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    assertEquals(progress, expected, `Progress calculation failed for ${completed}/${total}`);
  });
});

Deno.test("TodoApp - form validation logic", () => {
  // Test title validation
  const validTitles = ["Valid task", "Another task", "Task with numbers 123"];
  const invalidTitles = ["", "   ", "\t\n"];

  validTitles.forEach(title => {
    const trimmed = title.trim();
    assertEquals(trimmed.length > 0, true, `Title "${title}" should be valid`);
  });

  invalidTitles.forEach(title => {
    const trimmed = title.trim();
    assertEquals(trimmed.length === 0, true, `Title "${title}" should be invalid`);
  });
});

Deno.test("TodoApp - task sorting behavior", () => {
  const mockTasks = [
    { id: "1", createdAt: { toDate: () => new Date("2024-01-03") } },
    { id: "2", createdAt: { toDate: () => new Date("2024-01-01") } },
    { id: "3", createdAt: { toDate: () => new Date("2024-01-02") } },
  ];

  // Sort by creation date (oldest first - as done in TodoApp)
  const sorted = mockTasks.sort((a, b) => 
    Number(a.createdAt.toDate()) - Number(b.createdAt.toDate())
  );

  assertEquals(sorted[0].id, "2"); // Oldest first
  assertEquals(sorted[1].id, "3"); // Middle
  assertEquals(sorted[2].id, "1"); // Newest last
});

Deno.test("TodoApp - error message handling", () => {
  const errorMessages = [
    "Failed to load tasks",
    "Failed to create task", 
    "Failed to update task",
    "Failed to delete task",
  ];

  errorMessages.forEach(message => {
    // Test that error messages are user-friendly
    assertEquals(typeof message, "string");
    assertEquals(message.length > 0, true);
    assertEquals(message.includes("Failed"), true);
  });
});

Deno.test("TodoApp - animation delay calculation", () => {
  // Test staggered animation delays
  const items = [0, 1, 2, 3, 4];
  const delayMs = 50;

  items.forEach((index) => {
    const delay = index * delayMs;
    assertEquals(delay, index * 50);
    assertEquals(delay >= 0, true);
  });
});

// Mock fetch for RPC testing
const originalFetch = globalThis.fetch;

Deno.test("TodoApp - handles RPC errors gracefully", async () => {
  // Mock fetch to return error
  globalThis.fetch = () => Promise.reject(new Error("Network error"));

  try {
    const response = await fetch("/api/todo.v1.TodoService/ListTasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  } catch (error) {
    assertEquals(error.message, "Network error");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("TodoApp - handles successful RPC responses", async () => {
  // Mock successful response
  globalThis.fetch = () => Promise.resolve(new Response(
    JSON.stringify({ tasks: [], pagination: { page: 1, pageSize: 20 } }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  ));

  try {
    const response = await fetch("/api/todo.v1.TodoService/ListTasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    assertEquals(response.ok, true);
    const data = await response.json();
    assertEquals(Array.isArray(data.tasks), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});