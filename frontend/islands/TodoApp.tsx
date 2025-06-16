import { useSignal, useComputed } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { TodoService } from "@buf/wcygan_simple-connect-web-stack.bufbuild_es/todo/v1/todo_pb.js";
import type { Task } from "@buf/wcygan_simple-connect-web-stack.bufbuild_es/todo/v1/todo_pb.js";
import { Sidebar } from "../components/layout/Sidebar.tsx";
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

  const taskStats = useComputed(() => ({
    total: tasks.value.length,
    completed: tasks.value.filter(t => t.completed).length,
    pending: tasks.value.filter(t => !t.completed).length,
  }));

  const completionPercentage = useComputed(() => 
    taskStats.value.total > 0 
      ? Math.round((taskStats.value.completed / taskStats.value.total) * 100) 
      : 0
  );

  return (
    <>
      <Sidebar 
        stats={taskStats.value} 
        completionPercentage={completionPercentage.value} 
      />
      
      <main class="flex-1 flex flex-col bg-gray-850">
        {/* Error Banner */}
        {error.value && (
          <div class="bg-red-900/20 border-b border-red-900/30 px-4 py-2">
            <div class="flex items-center justify-between">
              <p class="text-sm text-red-400">{error.value}</p>
              <button
                onClick={() => error.value = null}
                class="text-red-400 hover:text-red-300"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <AddTaskForm
          value={newTaskTitle.value}
          onChange={(v) => newTaskTitle.value = v}
          onSubmit={createTask}
          isLoading={isAdding.value}
        />

        <TaskList
          tasks={tasks.value}
          loading={loading.value}
          onToggle={toggleTask}
          onDelete={deleteTask}
        />
      </main>
    </>
  );
}