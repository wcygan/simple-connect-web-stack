import { ComponentChildren } from "preact";
import { TopBar } from "./TopBar.tsx";

interface AppShellProps {
  children: ComponentChildren;
  stats?: {
    total: number;
    completed: number;
    pending: number;
  };
}

export function AppShell({ children, stats }: AppShellProps) {
  return (
    <div class="min-h-screen flex flex-col">
      <TopBar stats={stats} />
      <main class="flex-1 flex flex-col items-center px-4 py-8">
        <div class="w-full max-w-container animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}