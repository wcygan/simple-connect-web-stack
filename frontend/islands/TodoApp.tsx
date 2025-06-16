import { useTodoActions } from "../hooks/index.ts";
import { AppShell } from "../components/layout/AppShell.tsx";
import { TaskList } from "../components/todo/TaskList.tsx";
import { AddTaskForm } from "../components/todo/AddTaskForm.tsx";

export default function TodoApp() {
  const {
    tasks,
    loading,
    error,
    newTaskTitle,
    isAdding,
    clearError,
    createTask,
    toggleTask,
    deleteTask,
  } = useTodoActions();

  return (
    <AppShell>
      <div class="glass rounded-xl shadow-premium p-6 sm:p-8 space-y-6">
        <div class="text-center mb-6">
          <h1 class="text-3xl font-bold bg-gradient-to-r from-white via-indigo-100 to-purple-100 bg-clip-text text-transparent mb-2">
            My Todo List
          </h1>
          <p class="text-slate-400 text-sm font-medium">
            Stay organized, stay productive
          </p>
        </div>

        {/* Error Alert */}
        {error.value && (
          <div class="bg-red-950/50 border border-red-500/30 rounded-lg p-4 animate-slide-in">
            <div class="flex items-center justify-between gap-4">
              <p class="text-sm text-red-200">{error.value}</p>
              <button
                onClick={clearError}
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