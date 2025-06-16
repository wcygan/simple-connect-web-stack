import type { Task } from "@buf/wcygan_simple-connect-web-stack.bufbuild_es/todo/v1/todo_pb.js";

interface TaskItemProps {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const createdDate = task.createdAt 
    ? new Date(Number(task.createdAt.seconds) * 1000).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      })
    : '';

  return (
    <div class="group bg-white/[0.05] hover:bg-white/[0.08] border border-white/15 hover:border-white/25 rounded-lg p-4 hover-lift animate-scale-in">
      <div class="flex items-center gap-4">
        <input
          type="checkbox"
          id={`task-${task.id}`}
          checked={task.completed}
          onChange={() => onToggle(task)}
          class="cursor-pointer w-5 h-5"
          aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
        />
        
        <label 
          for={`task-${task.id}`}
          class={`flex-1 cursor-pointer select-none transition-all duration-200 text-base ${
            task.completed 
              ? "line-through text-gray-500" 
              : "text-gray-100"
          }`}
        >
          {task.title}
        </label>
        
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-400 hidden sm:block">
            {createdDate}
          </span>
          
          <button
            onClick={() => onDelete(task.id)}
            class="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-all duration-200 focus:opacity-100"
            aria-label={`Delete "${task.title}"`}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}