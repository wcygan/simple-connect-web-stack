import TodoApp from "../islands/TodoApp.tsx";

export default function Home() {
  return (
    <div class="min-h-screen bg-gray-100">
      <div class="max-w-4xl mx-auto py-8 px-4">
        <h1 class="text-3xl font-bold text-center mb-8">Todo App v2</h1>
        <p class="text-center text-gray-600 mb-8">
          Built with ConnectRPC + Go backend and Deno Fresh frontend
        </p>
        <TodoApp />
      </div>
    </div>
  );
}
