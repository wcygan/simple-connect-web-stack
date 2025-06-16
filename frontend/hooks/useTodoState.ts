import { useSignal } from "@preact/signals";
import type { Task } from "@buf/wcygan_simple-connect-web-stack.bufbuild_es/todo/v1/todo_pb.js";

/**
 * Custom hook for managing todo-related state
 * Consolidates all state signals into a single, reusable hook
 */
export function useTodoState() {
  const tasks = useSignal<Task[]>([]);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const newTaskTitle = useSignal("");
  const isAdding = useSignal(false);

  // Helper function to clear error
  const clearError = () => {
    error.value = null;
  };

  // Helper function to set error
  const setError = (message: string) => {
    error.value = message;
  };

  // Helper function to set loading state
  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading;
  };

  // Helper function to set tasks
  const setTasks = (newTasks: Task[]) => {
    tasks.value = newTasks;
  };

  // Helper function to add a task
  const addTask = (task: Task) => {
    tasks.value = [task, ...tasks.value];
  };

  // Helper function to update a task
  const updateTask = (updatedTask: Task) => {
    tasks.value = tasks.value.map(t => 
      t.id === updatedTask.id ? updatedTask : t
    );
  };

  // Helper function to remove a task
  const removeTask = (taskId: string) => {
    tasks.value = tasks.value.filter(t => t.id !== taskId);
  };

  // Helper function to sort tasks by creation date
  const sortTasksByDate = (tasksToSort: Task[]) => {
    return tasksToSort.sort((a, b) => {
      const dateA = a.createdAt ? new Date(Number(a.createdAt.seconds) * 1000) : new Date();
      const dateB = b.createdAt ? new Date(Number(b.createdAt.seconds) * 1000) : new Date();
      return dateB.getTime() - dateA.getTime(); // Newest first
    });
  };

  return {
    // State signals
    tasks,
    loading,
    error,
    newTaskTitle,
    isAdding,
    
    // Helper functions
    clearError,
    setError,
    setLoading,
    setTasks,
    addTask,
    updateTask,
    removeTask,
    sortTasksByDate,
  };
}