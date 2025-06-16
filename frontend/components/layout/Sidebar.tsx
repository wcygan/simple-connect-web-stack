interface SidebarProps {
  stats: {
    total: number;
    completed: number;
    pending: number;
  };
  completionPercentage: number;
}

export function Sidebar({ stats, completionPercentage }: SidebarProps) {
  return (
    <aside class="w-64 bg-gray-800 border-r border-gray-700 flex-shrink-0 p-4">
      <div class="space-y-6">
        {/* Quick Stats */}
        <div class="space-y-3">
          <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Overview</h2>
          
          <div class="space-y-2">
            <div class="flex justify-between items-center py-2 px-3 bg-gray-900 rounded">
              <span class="text-sm text-gray-300">Total</span>
              <span class="text-sm font-medium text-gray-100">{stats.total}</span>
            </div>
            
            <div class="flex justify-between items-center py-2 px-3 bg-gray-900 rounded">
              <span class="text-sm text-gray-300">Completed</span>
              <span class="text-sm font-medium text-green-400">{stats.completed}</span>
            </div>
            
            <div class="flex justify-between items-center py-2 px-3 bg-gray-900 rounded">
              <span class="text-sm text-gray-300">Pending</span>
              <span class="text-sm font-medium text-blue-400">{stats.pending}</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Progress</h2>
            <span class="text-xs font-medium text-gray-300">{completionPercentage}%</span>
          </div>
          
          <div class="w-full bg-gray-900 rounded-full h-2 overflow-hidden">
            <div 
              class="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div class="space-y-2">
          <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h2>
          
          <button 
            onClick={() => window.location.reload()}
            class="w-full text-left py-2 px-3 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
          >
            Refresh Tasks
          </button>
          
          <button 
            class="w-full text-left py-2 px-3 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
            disabled
          >
            Export Tasks (Coming Soon)
          </button>
        </div>

        {/* Footer */}
        <div class="pt-4 border-t border-gray-700">
          <div class="text-xs text-gray-500 space-y-1">
            <div>Built with ConnectRPC</div>
            <div>Powered by Deno Fresh</div>
          </div>
        </div>
      </div>
    </aside>
  );
}