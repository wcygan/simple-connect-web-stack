import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { TodoService } from "@buf/wcygan_simple-connect-web-stack.bufbuild_es/todo/v1/todo_pb.js";
import type { Task } from "@buf/wcygan_simple-connect-web-stack.bufbuild_es/todo/v1/todo_pb.js";
import { AppShell } from "../components/layout/AppShell.tsx";
import { TaskList } from "../components/todo/TaskList.tsx";
import { AddTaskForm } from "../components/todo/AddTaskForm.tsx";

// RPC client setup
const transport = createConnectTransport({ baseUrl: "/api" });
const client = createClient(TodoService, transport);

export default function TodoApp() {
  const tasks = useSignal<Task[]>([]);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const newTaskTitle = useSignal("");
  const isAdding = useSignal(false);

  useEffect(() => { loadTasks(); }, []);

  async function loadTasks() {
    loading.value = true;
    error.value = null;
    try {
      const res = await client.listTasks({ page: 1, pageSize: 100 });
      tasks.value = res.tasks.sort((a, b) => {
        const dateA = a.createdAt ? new Date(Number(a.createdAt.seconds) * 1000) : new Date();
        const dateB = b.createdAt ? new Date(Number(b.createdAt.seconds) * 1000) : new Date();
        return dateB.getTime() - dateA.getTime(); // Newest first
      });
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load tasks";
    } finally {
      loading.value = false;
    }
  }

  async function createTask(e: Event) {
    e.preventDefault();
    if (!newTaskTitle.value.trim() || isAdding.value) return;
    
    isAdding.value = true;
    error.value = null;
    try {
      const res = await client.createTask({ title: newTaskTitle.value.trim() });
      tasks.value = [res.task!, ...tasks.value]; // Add to beginning
      newTaskTitle.value = "";
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to create task";
    } finally {
      isAdding.value = false;
    }
  }

  async function toggleTask(task: Task) {
    try {
      const res = await client.updateTask({ 
        id: task.id, 
        title: task.title, 
        completed: !task.completed 
      });
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

  return (
    <AppShell>
      <div class="glass rounded-xl shadow-soft p-6 sm:p-8 space-y-6">
        <h1 class="text-2xl font-bold text-center mb-4">
          My&nbsp;Todo&nbsp;List
        </h1>

        {/* Error Alert */}
        {error.value && (
          <div class="bg-red-950/50 border border-red-500/30 rounded-lg p-4 animate-slide-in">
            <div class="flex items-center justify-between gap-4">
              <p class="text-sm text-red-200">{error.value}</p>
              <button
                onClick={() => error.value = null}
                class="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-950/50"
                aria-label="Dismiss error"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Add-task input */}
        <AddTaskForm
          value={newTaskTitle.value}
          onChange={(v) => (newTaskTitle.value = v)}
          onSubmit={createTask}
          isLoading={isAdding.value}
        />

        {/* Tasks list */}
        <TaskList
          tasks={tasks.value}
          loading={loading.value}
          onToggle={toggleTask}
          onDelete={deleteTask}
        />
      </div>
    </AppShell>
  );
}