import TodoApp from "../islands/TodoApp.tsx";

export default function Home() {
  return (
    <div class="min-h-screen px-4 py-8 md:py-12">
      <div class="max-w-2xl mx-auto">
        <header class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold text-gradient mb-3">
            Todo App v2
          </h1>
          <p class="text-lg text-text-secondary mb-4 max-w-md mx-auto">
            A modern stack demo with Go ConnectRPC, Protocol Buffers, and Deno Fresh.
          </p>
          <div class="inline-flex items-center gap-2 text-sm text-success bg-surface px-3 py-1 rounded-full border border-border">
            <span class="w-2 h-2 bg-success rounded-full animate-pulse"></span>
            Connected to RPC Backend
          </div>
        </header>
        <main>
          <TodoApp />
        </main>
        <footer class="text-center mt-12 text-sm text-text-muted">
          <p>Built with modern web technologies and dark mode in mind.</p>
        </footer>
      </div>
    </div>
  );
}
