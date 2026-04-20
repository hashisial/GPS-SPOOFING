import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { navigation } from "../../config/navigation.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useTheme } from "../../hooks/useTheme.js";
import { authService } from "../../services/auth/auth.service.js";
import { clearStoredSession } from "../../utils/helpers/auth-storage.js";
import { clearSession } from "../../app/store/slices/authSlice.js";
import { ROUTE_PATHS } from "../../routes/route-paths.js";

function resolveTitle(pathname) {
  const allItems = [...navigation.primary, ...navigation.secondary, ...navigation.public];
  return allItems.find((item) => item.path === pathname)?.label ?? "Workspace";
}

export function Topbar({ onMenuClick }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  async function handleLogout() {
    try {
      await authService.logout();
    } catch {
      // The session still needs to be cleared on the client.
    } finally {
      clearStoredSession();
      dispatch(clearSession());
      navigate(ROUTE_PATHS.login, {
        replace: true
      });
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background-elevated)] px-3 py-3 backdrop-blur sm:px-5 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-[var(--border)] bg-[var(--background-muted)] text-[var(--text-primary)] transition hover:border-[var(--accent)] lg:hidden"
            aria-label="Open navigation menu"
          >
            <span aria-hidden="true" className="h-0.5 w-5 rounded-full bg-current" />
            <span aria-hidden="true" className="h-0.5 w-5 rounded-full bg-current" />
            <span aria-hidden="true" className="h-0.5 w-5 rounded-full bg-current" />
          </button>

          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)] sm:text-xs">
              Module
            </p>
            <h2 className="truncate text-base font-semibold sm:text-lg">
              {resolveTitle(location.pathname)}
            </h2>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)] sm:px-4 sm:text-sm"
            aria-label={`Switch from ${theme} theme`}
          >
            <span className="hidden sm:inline">Theme: </span>
            {theme}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)] sm:px-4 sm:text-sm"
          >
            <span className="hidden sm:inline">Sign out</span>
            <span className="sm:hidden">Exit</span>
          </button>
          <div className="hidden rounded-full border border-[var(--border)] bg-[var(--background-muted)] px-4 py-2 text-right md:block">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              Signed In
            </p>
            <p className="max-w-[11rem] truncate text-sm font-medium">
              {user?.name ?? "Frontend shell"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
