interface AddTaskFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: Event) => void;
  isLoading: boolean;
}

export function AddTaskForm({ value, onChange, onSubmit, isLoading }: AddTaskFormProps) {
  return (
    <form onSubmit={onSubmit} class="flex gap-2 p-3 bg-gray-800 border-b border-gray-700">
      <input
        type="text"
        value={value}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        placeholder="Add a new task..."
        maxLength={255}
        class="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
        disabled={isLoading}
      />
      
      <button
        type="submit"
        disabled={!value.trim() || isLoading}
        class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded transition-colors disabled:cursor-not-allowed"
      >
        {isLoading ? 'Adding...' : 'Add'}
      </button>
    </form>
  );
}