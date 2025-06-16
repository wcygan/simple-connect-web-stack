import { useSignal, useComputed } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { TodoService } from "@buf/wcygan_simple-connect-web-stack.bufbuild_es/todo/v1/todo_pb.js";
import type { Task } from "@buf/wcygan_simple-connect-web-stack.bufbuild_es/todo/v1/todo_pb.js";

// Create the RPC client
const transport = createConnectTransport({
  baseUrl: "/api",
});

const client = createClient(TodoService, transport);

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
    <div class="glass-card rounded-2xl p-8 fade-in">
      {/* Error display */}
      {error.value && (
        <div class="mb-6 alert-error fade-in">
          <div class="flex items-center gap-2">
            <span class="text-lg">⚠️</span>
            <span class="font-medium">{error.value}</span>
          </div>
        </div>
      )}

      {/* Add task form */}
      <form onSubmit={createTask} class="mb-8">
        <div class="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newTaskTitle.value}
            onInput={(e) => newTaskTitle.value = (e.target as HTMLInputElement).value}
            placeholder="What needs to be done today? ✨"
            class="flex-1 enhanced-input"
            disabled={loading.value}
          />
          <button
            type="submit"
            disabled={loading.value || !newTaskTitle.value.trim()}
            class="btn-primary"
          >
            {loading.value ? (
              <div class="flex items-center gap-2">
                <div class="loading-spinner w-4 h-4"></div>
                Adding...
              </div>
            ) : (
              <div class="flex items-center gap-2">
                <span>✨</span>
                Add Task
              </div>
            )}
          </button>
        </div>
      </form>

      {/* Task stats */}
      <div class="mb-6 stats-card">
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-gray-700">{taskCount.value.total}</div>
            <div class="text-sm text-gray-500 font-medium">Total</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-green-600">{taskCount.value.completed}</div>
            <div class="text-sm text-gray-500 font-medium">Completed</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-blue-600">{taskCount.value.pending}</div>
            <div class="text-sm text-gray-500 font-medium">Pending</div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading.value && tasks.value.length === 0 && (
        <div class="text-center py-12 fade-in">
          <div class="loading-spinner mx-auto mb-4"></div>
          <div class="text-gray-500 font-medium">Loading your tasks...</div>
        </div>
      )}

      {/* Task list */}
      <div class="space-y-3">
        {tasks.value.map((task, index) => (
          <div
            key={task.id}
            class={`task-item group fade-in ${task.completed ? 'completed' : ''}`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div class="flex items-center gap-4">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task)}
                disabled={loading.value}
                class="custom-checkbox"
              />
              <span
                class={`flex-1 font-medium transition-all duration-200 ${
                  task.completed 
                    ? "line-through text-gray-500" 
                    : "text-gray-800"
                }`}
              >
                {task.title}
              </span>
              <button
                onClick={() => deleteTask(task.id)}
                disabled={loading.value}
                class="btn-danger opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                title="Delete task"
              >
                <span class="flex items-center gap-1">
                  🗑️
                  <span class="hidden sm:inline">Delete</span>
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!loading.value && tasks.value.length === 0 && (
        <div class="text-center py-12 fade-in">
          <div class="text-6xl mb-4">📝</div>
          <div class="text-xl font-medium text-gray-600 mb-2">
            No tasks yet!
          </div>
          <div class="text-gray-500">
            Add your first task above to get started.
          </div>
        </div>
      )}

      {/* Floating progress indicator */}
      {tasks.value.length > 0 && (
        <div class="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full h-2 overflow-hidden">
          <div 
            class="h-full bg-white transition-all duration-500 ease-out"
            style={{ 
              width: `${taskCount.value.total > 0 ? (taskCount.value.completed / taskCount.value.total) * 100 : 0}%` 
            }}
          ></div>
        </div>
      )}
    </div>
  );
}