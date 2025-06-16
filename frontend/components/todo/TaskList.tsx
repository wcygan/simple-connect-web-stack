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
      <div class="p-4 space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} class="h-8 bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div class="flex-1 flex items-center justify-center text-gray-500">
        <div class="text-center">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p class="text-sm">No tasks yet</p>
          <p class="text-xs mt-1">Add one above to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div class="flex-1 overflow-y-auto">
      <div class="p-2">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}