import { NavLink } from "react-router-dom";
import { navigation } from "../../config/navigation.js";
import { env } from "../../config/env.js";
import { useAuth } from "../../hooks/useAuth.js";

function canAccess(item, role) {
  return !item.roles || item.roles.includes(role);
}

function NavSection({ title, items, role, onNavigate }) {
  const visibleItems = items.filter((item) => canAccess(item, role));

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="px-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">
        {title}
      </p>
      <div className="space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                "block rounded-2xl border px-3 py-3 transition active:scale-[0.99]",
                isActive
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[var(--background-muted)] hover:text-[var(--text-primary)]"
              ].join(" ")
            }
          >
            <div className="text-sm font-semibold">{item.label}</div>
            <div className="mt-1 text-xs opacity-80">{item.description}</div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

function SidebarContent({ role, onNavigate }) {
  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Control Center
        </p>
        <h1 className="mt-2 text-xl font-semibold leading-tight">{env.appName}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Scalable React workspace for GPS spoofing detection operations.
        </p>
      </div>
      <div className="space-y-8">
        <NavSection
          title="Primary"
          items={navigation.primary}
          role={role}
          onNavigate={onNavigate}
        />
        <NavSection
          title="Secondary"
          items={navigation.secondary}
          role={role}
          onNavigate={onNavigate}
        />
      </div>
    </>
  );
}

export function SidebarNav({ isMobileOpen = false, onMobileClose = () => {} }) {
  const { role } = useAuth();

  return (
    <>
      <aside className="hidden h-screen overflow-y-auto border-r border-[var(--border)] bg-[var(--background-elevated)] px-5 py-6 lg:sticky lg:top-0 lg:block">
        <SidebarContent role={role} />
      </aside>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          isMobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!isMobileOpen}
      >
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onMobileClose}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${
            isMobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-[min(22rem,calc(100vw-1.5rem))] overflow-y-auto border-r border-[var(--border)] bg-[var(--background)] px-4 py-5 shadow-2xl transition-transform duration-300 ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Menu
            </div>
            <button
              type="button"
              onClick={onMobileClose}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
            >
              Close
            </button>
          </div>
          <SidebarContent role={role} onNavigate={onMobileClose} />
        </aside>
      </div>
    </>
  );
}
