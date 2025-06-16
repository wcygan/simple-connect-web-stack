import { ComponentChildren } from "preact";
import { TopBar } from "./TopBar.tsx";

interface AppShellProps {
  children: ComponentChildren;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div class="h-screen bg-gray-900 flex flex-col overflow-hidden">
      <TopBar />
      <div class="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  );
}