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
    <div class="group flex items-center gap-3 py-2 px-3 hover:bg-gray-800 rounded transition-colors">
      <input
        type="checkbox"
        id={`task-${task.id}`}
        checked={task.completed}
        onChange={() => onToggle(task)}
        class="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-0 focus:ring-offset-0 cursor-pointer"
      />
      
      <label 
        for={`task-${task.id}`}
        class={`flex-1 text-sm cursor-pointer select-none ${
          task.completed 
            ? "line-through text-gray-500" 
            : "text-gray-200"
        }`}
      >
        {task.title}
      </label>
      
      <span class="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
        {createdDate}
      </span>
      
      <button
        onClick={() => onDelete(task.id)}
        class="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
        title="Delete task"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}