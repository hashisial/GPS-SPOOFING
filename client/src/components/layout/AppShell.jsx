import { SidebarNav } from "./SidebarNav.jsx";
import { Topbar } from "./Topbar.jsx";

export function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <SidebarNav />
        <div className="flex min-h-screen flex-col">
          <Topbar />
          <main className="flex-1 px-4 pb-6 pt-2 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
