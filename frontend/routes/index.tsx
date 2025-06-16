import TodoApp from "../islands/TodoApp.tsx";
import { AppShell } from "../components/layout/AppShell.tsx";

export default function Home() {
  return (
    <AppShell>
      <TodoApp />
    </AppShell>
  );
}