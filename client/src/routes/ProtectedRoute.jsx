import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { ROUTE_PATHS } from "./route-paths.js";

export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--background-elevated)] px-8 py-6">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            Session Check
          </div>
          <div className="mt-3 text-lg font-semibold text-[var(--text-primary)]">
            Restoring your secure workspace...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTE_PATHS.login} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
