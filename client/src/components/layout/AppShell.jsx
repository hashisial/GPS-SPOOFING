import { useEffect, useState } from "react";
import { SidebarNav } from "./SidebarNav.jsx";
import { Topbar } from "./Topbar.jsx";

export function AppShell({ children }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isMobileNavOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsMobileNavOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileNavOpen]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--text-primary)]">
      <div className="grid min-h-screen min-w-0 lg:grid-cols-[280px_minmax(0,1fr)]">
        <SidebarNav
          isMobileOpen={isMobileNavOpen}
          onMobileClose={() => setIsMobileNavOpen(false)}
        />
        <div className="flex min-h-screen min-w-0 flex-col">
          <Topbar onMenuClick={() => setIsMobileNavOpen(true)} />
          <main className="min-w-0 flex-1 px-3 pb-6 pt-3 sm:px-5 lg:px-8">
            <div className="mx-auto w-full max-w-7xl min-w-0">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
