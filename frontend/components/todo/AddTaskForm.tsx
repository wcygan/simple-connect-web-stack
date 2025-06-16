interface AddTaskFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: Event) => void;
  isLoading: boolean;
}

export function AddTaskForm({ value, onChange, onSubmit, isLoading }: AddTaskFormProps) {
  return (
    <form onSubmit={onSubmit} class="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        value={value}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        placeholder="Add a new task..."
        maxLength={255}
        class="flex-1 bg-surface hover:bg-surface-hover border border-surface-border rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-all duration-200"
        disabled={isLoading}
      />
      
      <button
        type="submit"
        disabled={!value.trim() || isLoading}
        class="px-6 py-3 bg-primary hover:bg-primary-light disabled:bg-gray-800 disabled:text-gray-500 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-glow disabled:shadow-none whitespace-nowrap"
      >
        {isLoading ? (
          <span class="flex items-center gap-2">
            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Adding...
          </span>
        ) : 'Add Task'}
      </button>
    </form>
  );
}