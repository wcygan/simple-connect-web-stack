import { useSignal, useComputed } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { TodoService } from "@buf/wcygan_simple-connect-web-stack.bufbuild_es/todo/v1/todo_pb.js";
import type { Task } from "@buf/wcygan_simple-connect-web-stack.bufbuild_es/todo/v1/todo_pb.js";

// RPC client setup
const transport = createConnectTransport({ baseUrl: "/api" });
const client = createClient(TodoService, transport);

function StatCard({ label, value, colorClass }: { label: string; value: number | string; colorClass: string }) {
  return (
    <div class="bg-secondary/50 backdrop-blur-sm border border-border rounded-lg p-4 text-center transition-all duration-300 hover:bg-secondary/70 hover:scale-105">
      <div class={`text-2xl font-bold ${colorClass} mb-1`}>{value}</div>
      <div class="text-sm text-text-secondary font-medium">{label}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div class="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} class="bg-secondary/30 p-4 rounded-lg animate-pulse flex items-center gap-3">
          <div class="w-5 h-5 bg-surface rounded"></div>
          <div class="h-4 bg-surface rounded flex-1"></div>
          <div class="w-16 h-6 bg-surface rounded"></div>
        </div>
      ))}
    </div>
  );
}

export default function TodoApp() {
  const tasks = useSignal<Task[]>([]);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const newTaskTitle = useSignal("");

  useEffect(() => { loadTasks(); }, []);

  async function loadTasks() {
    loading.value = true;
    error.value = null;
    try {
      const res = await client.listTasks({ page: 1, pageSize: 100 });
      tasks.value = res.tasks.sort((a, b) => Number(a.createdAt?.toDate()) - Number(b.createdAt?.toDate()));
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load tasks";
    } finally {
      loading.value = false;
    }
  }

  async function createTask(e: Event) {
    e.preventDefault();
    if (!newTaskTitle.value.trim()) return;
    try {
      const res = await client.createTask({ title: newTaskTitle.value.trim() });
      tasks.value = [...tasks.value, res.task!];
      newTaskTitle.value = "";
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to create task";
    }
  }

  async function toggleTask(task: Task) {
    try {
      const res = await client.updateTask({ id: task.id, title: task.title, completed: !task.completed });
      tasks.value = tasks.value.map(t => t.id === task.id ? res.task! : t);
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to update task";
    }
  }

  async function deleteTask(id: string) {
    try {
      await client.deleteTask({ id });
      tasks.value = tasks.value.filter(t => t.id !== id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to delete task";
    }
  }

  const taskCount = useComputed(() => ({
    total: tasks.value.length,
    completed: tasks.value.filter(t => t.completed).length,
    pending: tasks.value.length - tasks.value.filter(t => t.completed).length,
  }));

  return (
    <div class="bg-surface/80 backdrop-blur-md border border-border rounded-xl p-4 sm:p-6 shadow-card animate-fade-in">
      {/* Error display */}
      {error.value && (
        <div class="mb-6 p-4 bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg animate-fade-in">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span class="font-medium">{error.value}</span>
          </div>
        </div>
      )}

      {/* Add task form */}
      <form onSubmit={createTask} class="flex items-center gap-3 mb-6">
        <div class="relative flex-1">
          <input
            type="text"
            value={newTaskTitle.value}
            onInput={(e) => newTaskTitle.value = (e.target as HTMLInputElement).value}
            placeholder="What's on your mind?"
            class="w-full bg-background/50 border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
          />
        </div>
        <button
          type="submit"
          disabled={!newTaskTitle.value.trim()}
          class="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover disabled:bg-secondary disabled:text-text-muted disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 min-w-fit"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="hidden sm:inline">Add Task</span>
        </button>
      </form>

      {/* Task stats */}
      <div class="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total" value={taskCount.value.total} colorClass="text-text-primary" />
        <StatCard label="Completed" value={taskCount.value.completed} colorClass="text-success" />
        <StatCard label="Pending" value={taskCount.value.pending} colorClass="text-primary" />
      </div>

      {/* Loading state */}
      {loading.value && <LoadingSkeleton />}

      {/* Task list */}
      {!loading.value && tasks.value.length > 0 && (
        <ul class="space-y-2">
          {tasks.value.map((task, index) => (
            <li
              key={task.id}
              class="group bg-secondary/30 hover:bg-secondary/50 rounded-lg p-4 flex items-center justify-between transition-all duration-200 animate-fade-in border border-transparent hover:border-border/50"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="relative">
                  <input
                    type="checkbox"
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onChange={() => toggleTask(task)}
                    class="h-5 w-5 rounded border-2 border-border bg-background text-primary focus:ring-primary focus:ring-2 cursor-pointer transition-all duration-200"
                  />
                  {task.completed && (
                    <svg class="absolute inset-0 w-5 h-5 text-success pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  )}
                </div>
                <label 
                  for={`task-${task.id}`}
                  class={`cursor-pointer transition-all duration-200 truncate flex-1 ${
                    task.completed 
                      ? "line-through text-text-muted" 
                      : "text-text-primary hover:text-primary"
                  }`}
                >
                  {task.title}
                </label>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                class="text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 rounded-md hover:bg-danger/10"
                title="Delete task"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Empty state */}
      {!loading.value && tasks.value.length === 0 && (
        <div class="text-center py-12 animate-fade-in">
          <div class="w-16 h-16 mx-auto mb-4 bg-secondary/50 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-text-primary mb-2">All caught up!</h3>
          <p class="text-text-secondary">Add a new task to get started.</p>
        </div>
      )}

      {/* Progress bar */}
      {tasks.value.length > 0 && (
        <div class="mt-6">
          <div class="flex justify-between text-sm text-text-secondary mb-2">
            <span>Progress</span>
            <span>{Math.round(taskCount.value.total > 0 ? (taskCount.value.completed / taskCount.value.total) * 100 : 0)}%</span>
          </div>
          <div class="bg-surface rounded-full h-2 overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-primary to-success transition-all duration-500 ease-out rounded-full"
              style={{ 
                width: `${taskCount.value.total > 0 ? (taskCount.value.completed / taskCount.value.total) * 100 : 0}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}