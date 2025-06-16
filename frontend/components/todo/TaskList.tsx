import type { Task } from "@buf/wcygan_simple-connect-web-stack.bufbuild_es/todo/v1/todo_pb.js";
import { TaskItem } from "./TaskItem.tsx";

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskList({ tasks, loading, onToggle, onDelete }: TaskListProps) {
  if (loading) {
    return (
      <div class="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} class="h-16 bg-surface rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div class="flex flex-col items-center justify-center py-16 text-gray-400">
        <div class="w-20 h-20 mb-6 rounded-full bg-surface flex items-center justify-center">
          <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-lg font-medium text-gray-300">No tasks yet</p>
        <p class="text-sm mt-2 text-gray-500">Add your first task to get started</p>
      </div>
    );
  }

  return (
    <div class="space-y-3">
      {tasks.map((task, index) => (
        <div
          key={task.id}
          class="animate-slide-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <TaskItem
            task={task}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
}