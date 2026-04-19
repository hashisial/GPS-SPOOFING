import { NavLink } from "react-router-dom";
import { navigation } from "../../config/navigation.js";
import { env } from "../../config/env.js";
import { useAuth } from "../../hooks/useAuth.js";

function canAccess(item, role) {
  return !item.roles || item.roles.includes(role);
}

function NavSection({ title, items, role }) {
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
            className={({ isActive }) =>
              [
                "block rounded-2xl border px-3 py-3 transition",
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

export function SidebarNav() {
  const { role } = useAuth();

  return (
    <aside className="hidden border-r border-[var(--border)] bg-[var(--background-elevated)] px-5 py-6 lg:block">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Control Center
        </p>
        <h1 className="mt-2 text-xl font-semibold">{env.appName}</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Scalable React workspace for GPS spoofing detection operations.
        </p>
      </div>
      <div className="space-y-8">
        <NavSection title="Primary" items={navigation.primary} role={role} />
        <NavSection title="Secondary" items={navigation.secondary} role={role} />
      </div>
    </aside>
  );
}
