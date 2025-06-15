import { useSignal, useComputed } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { createPromiseClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { TodoService } from "../lib/gen/todo/v1/todo_connect.ts";
import type { Task } from "../lib/gen/todo/v1/todo_pb.ts";

// Create the RPC client
const transport = createConnectTransport({
  baseUrl: "/api",
});

const client = createPromiseClient(TodoService, transport);

export default function TodoApp() {
  const tasks = useSignal<Task[]>([]);
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);
  const newTaskTitle = useSignal("");

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await client.listTasks({
        page: 1,
        pageSize: 50,
      });
      tasks.value = response.tasks;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load tasks";
      console.error("Failed to load tasks:", err);
    } finally {
      loading.value = false;
    }
  }

  async function createTask(e: Event) {
    e.preventDefault();
    
    if (!newTaskTitle.value.trim()) return;
    
    loading.value = true;
    error.value = null;
    
    try {
      const response = await client.createTask({
        title: newTaskTitle.value.trim(),
      });
      
      // Add the new task to the list
      tasks.value = [...tasks.value, response.task!];
      newTaskTitle.value = "";
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to create task";
      console.error("Failed to create task:", err);
    } finally {
      loading.value = false;
    }
  }

  async function toggleTask(task: Task) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await client.updateTask({
        id: task.id,
        title: task.title,
        completed: !task.completed,
      });
      
      // Update the task in the list
      tasks.value = tasks.value.map(t => 
        t.id === task.id ? response.task! : t
      );
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to update task";
      console.error("Failed to update task:", err);
    } finally {
      loading.value = false;
    }
  }

  async function deleteTask(id: string) {
    loading.value = true;
    error.value = null;
    
    try {
      await client.deleteTask({ id });
      
      // Remove the task from the list
      tasks.value = tasks.value.filter(t => t.id !== id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to delete task";
      console.error("Failed to delete task:", err);
    } finally {
      loading.value = false;
    }
  }

  const taskCount = useComputed(() => ({
    total: tasks.value.length,
    completed: tasks.value.filter(t => t.completed).length,
    pending: tasks.value.filter(t => !t.completed).length,
  }));

  return (
    <div class="bg-white rounded-lg shadow-md p-6">
      {/* Error display */}
      {error.value && (
        <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error.value}
        </div>
      )}

      {/* Add task form */}
      <form onSubmit={createTask} class="mb-6">
        <div class="flex gap-2">
          <input
            type="text"
            value={newTaskTitle.value}
            onInput={(e) => newTaskTitle.value = (e.target as HTMLInputElement).value}
            placeholder="Add a new task..."
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading.value}
          />
          <button
            type="submit"
            disabled={loading.value || !newTaskTitle.value.trim()}
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Add Task
          </button>
        </div>
      </form>

      {/* Task stats */}
      <div class="mb-4 text-sm text-gray-600">
        Total: {taskCount.value.total} | 
        Completed: {taskCount.value.completed} | 
        Pending: {taskCount.value.pending}
      </div>

      {/* Loading state */}
      {loading.value && tasks.value.length === 0 && (
        <div class="text-center py-8 text-gray-500">
          Loading tasks...
        </div>
      )}

      {/* Task list */}
      <div class="space-y-2">
        {tasks.value.map((task) => (
          <div
            key={task.id}
            class="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task)}
              disabled={loading.value}
              class="w-5 h-5 text-blue-600 rounded cursor-pointer"
            />
            <span
              class={`flex-1 ${task.completed ? "line-through text-gray-500" : ""}`}
            >
              {task.title}
            </span>
            <button
              onClick={() => deleteTask(task.id)}
              disabled={loading.value}
              class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md disabled:text-gray-400"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!loading.value && tasks.value.length === 0 && (
        <div class="text-center py-8 text-gray-500">
          No tasks yet. Add one above!
        </div>
      )}
    </div>
  );
}