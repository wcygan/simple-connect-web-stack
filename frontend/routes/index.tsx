import TodoApp from "../islands/TodoApp.tsx";

export default function Home() {
  return (
    <div class="min-h-screen fresh-gradient">
      <div class="max-w-4xl mx-auto py-12 px-4 relative z-10">
        <div class="text-center mb-12">
          <h1 class="text-5xl md:text-6xl font-bold title-gradient mb-4">
            Todo App v2
          </h1>
          <p class="text-xl text-white/80 font-medium">
            Built with ConnectRPC + Go backend and Deno Fresh frontend
          </p>
          <div class="mt-4 inline-flex items-center gap-2 text-white/60 text-sm">
            <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Connected to RPC Backend
          </div>
        </div>
        <TodoApp />
      </div>
    </div>
  );
}
