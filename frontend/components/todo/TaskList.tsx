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
      <div class="flex flex-col items-center justify-center py-12 text-gray-400 animate-fade-in">
        <div class="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-white/10 flex items-center justify-center animate-float">
          <svg class="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-slate-300 mb-2">Ready to get organized?</h3>
        <p class="text-sm text-slate-400 text-center max-w-xs leading-relaxed">
          Your task list is empty. Create your first task above to start building productive habits.
        </p>
        <div class="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
          <p class="text-xs text-slate-500 font-medium">✨ Stay focused, stay productive</p>
        </div>
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