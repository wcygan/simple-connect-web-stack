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
        {[...Array(3)].map((_, i) => (
          <div key={i} class="h-[60px] bg-white/[0.05] border border-white/15 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div class="flex flex-col items-center justify-center py-8 text-gray-400">
        <div class="w-12 h-12 mb-3 rounded-full bg-white/[0.05] flex items-center justify-center">
          <svg class="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p class="text-sm font-medium text-gray-400">No tasks yet</p>
        <p class="text-xs mt-1 text-gray-500">Add your first task to get started</p>
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