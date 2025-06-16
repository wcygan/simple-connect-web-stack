export function TopBar() {
  return (
    <header class="h-12 bg-gray-900 border-b border-gray-800 flex-shrink-0">
      <div class="h-full max-w-[1600px] mx-auto px-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h1 class="text-lg font-semibold text-gray-100">Tasks</h1>
          <span class="text-xs text-gray-500">v2.0</span>
        </div>
        
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
          <span class="text-xs text-gray-400">Connected</span>
        </div>
      </div>
    </header>
  );
}