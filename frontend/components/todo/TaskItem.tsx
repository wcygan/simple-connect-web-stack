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
        day: 'numeric',
        year: 'numeric'
      })
    : '';

  return (
    <div class="group bg-surface hover:bg-surface-hover border border-surface-border rounded-lg p-4 transition-all duration-200 hover:shadow-lg">
      <div class="flex items-center gap-4">
        <input
          type="checkbox"
          id={`task-${task.id}`}
          checked={task.completed}
          onChange={() => onToggle(task)}
          class="cursor-pointer"
        />
        
        <label 
          for={`task-${task.id}`}
          class={`flex-1 cursor-pointer select-none transition-all duration-200 ${
            task.completed 
              ? "line-through text-gray-500" 
              : "text-white"
          }`}
        >
          {task.title}
        </label>
        
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
            {createdDate}
          </span>
          
          <button
            onClick={() => onDelete(task.id)}
            class="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all duration-200"
            title="Delete task"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      {task.completed && (
        <div class="mt-2 flex items-center gap-2 text-xs text-emerald-400">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span>Completed</span>
        </div>
      )}
    </div>
  );
}