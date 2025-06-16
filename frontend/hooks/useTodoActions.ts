import { useEffect } from "preact/hooks";
import type { Client } from "@connectrpc/connect";
import type { Task } from "@buf/wcygan_simple-connect-web-stack.bufbuild_es/todo/v1/todo_pb.js";
import { useTodoClient } from "./useTodoClient.ts";
import { useTodoState } from "./useTodoState.ts";

/**
 * Custom hook for todo CRUD operations
 * Combines state management with business logic for todo operations
 */
export function useTodoActions() {
  const client = useTodoClient();
  const state = useTodoState();

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    state.setLoading(true);
    state.clearError();
    
    try {
      const res = await client.listTasks({ page: 1, pageSize: 100 });
      const sortedTasks = state.sortTasksByDate(res.tasks);
      state.setTasks(sortedTasks);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load tasks";
      state.setError(message);
    } finally {
      state.setLoading(false);
    }
  };

  const createTask = async (e: Event) => {
    e.preventDefault();
    if (!state.newTaskTitle.value.trim() || state.isAdding.value) return;
    
    state.isAdding.value = true;
    state.clearError();
    
    try {
      const res = await client.createTask({ 
        title: state.newTaskTitle.value.trim() 
      });
      
      if (res.task) {
        state.addTask(res.task);
        state.newTaskTitle.value = "";
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create task";
      state.setError(message);
    } finally {
      state.isAdding.value = false;
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      const res = await client.updateTask({
        id: task.id,
        title: task.title,
        completed: !task.completed
      });
      
      if (res.task) {
        state.updateTask(res.task);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update task";
      state.setError(message);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await client.deleteTask({ id });
      state.removeTask(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete task";
      state.setError(message);
    }
  };

  return {
    // State
    ...state,
    
    // Actions
    loadTasks,
    createTask,
    toggleTask,
    deleteTask,
  };
}