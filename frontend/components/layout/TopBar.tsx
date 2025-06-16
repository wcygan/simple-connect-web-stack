interface TopBarProps {
  stats?: {
    total: number;
    completed: number;
    pending: number;
  };
}

export function TopBar({ stats }: TopBarProps) {
  return (
    <header class="sticky top-0 z-50 glass-dark border-b border-white/10">
      <div class="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div class="flex items-center justify-between">
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <h1 class="text-2xl sm:text-3xl font-bold text-white">
              Tasks
            </h1>
            {stats && stats.total > 0 && (
              <div class="flex items-center gap-4 text-sm">
                <span class="text-gray-300">
                  <span class="font-semibold text-white">{stats.total}</span> total
                </span>
                <span class="text-gray-600">•</span>
                <span class="text-gray-300">
                  <span class="font-semibold text-emerald-400">{stats.completed}</span> done
                </span>
                <span class="text-gray-600">•</span>
                <span class="text-gray-300">
                  <span class="font-semibold text-blue-400">{stats.pending}</span> pending
                </span>
              </div>
            )}
          </div>
          
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span class="text-xs text-gray-400 font-medium uppercase tracking-wider">Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}