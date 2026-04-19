import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { ROUTE_PATHS } from "./route-paths.js";

export function RoleRoute({ allowedRoles = [] }) {
  const { role, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={ROUTE_PATHS.dashboard} replace />;
  }

  return <Outlet />;
}
