import { ComponentChildren } from "preact";

interface AppShellProps {
  children: ComponentChildren;
}

export function AppShell({ children }: AppShellProps) {
  // Full-height flexbox that keeps its contents perfectly centred
  return (
    <div class="min-h-screen flex items-center justify-center px-4">
      {/* Card wrapper – max-width stays narrow like V1, scales down on mobile */}
      <div class="w-full max-w-md">{children}</div>
    </div>
  );
}