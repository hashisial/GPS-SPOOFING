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

export function Topbar() {
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
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background-elevated)] px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">
            Module
          </p>
          <h2 className="text-lg font-semibold">{resolveTitle(location.pathname)}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
          >
            Theme: {theme}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-white/20 hover:text-white"
          >
            Sign out
          </button>
          <div className="rounded-full border border-[var(--border)] bg-[var(--background-muted)] px-4 py-2 text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              Signed In
            </p>
            <p className="text-sm font-medium">{user?.name ?? "Frontend shell"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
