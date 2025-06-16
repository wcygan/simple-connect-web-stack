interface TopBarProps {
  stats?: {
    total: number;
    completed: number;
    pending: number;
  };
}

export function TopBar({ stats }: TopBarProps) {
  return (
    <header class="sticky top-0 z-50 glass-dark border-b border-surface-border">
      <div class="max-w-container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h1 class="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Tasks
            </h1>
            {stats && (
              <div class="flex items-center gap-3 text-xs sm:text-sm">
                <span class="text-gray-400">
                  <span class="font-medium text-white">{stats.total}</span> total
                </span>
                <span class="text-gray-500">•</span>
                <span class="text-gray-400">
                  <span class="font-medium text-emerald-400">{stats.completed}</span> done
                </span>
              </div>
            )}
          </div>
          
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span class="text-xs text-gray-400 font-medium">Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}