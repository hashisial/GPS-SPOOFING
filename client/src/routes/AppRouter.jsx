import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "../app/layouts/AuthLayout.jsx";
import { AppLayout } from "../app/layouts/AppLayout.jsx";
import { APP_ROLES } from "../utils/constants/app.constants.js";
import { ProtectedRoute } from "./ProtectedRoute.jsx";
import { RoleRoute } from "./RoleRoute.jsx";
import { ROUTE_PATHS } from "./route-paths.js";

function lazyPage(loader, exportName) {
  return lazy(() =>
    loader().then((module) => ({
      default: module[exportName]
    }))
  );
}

function RouteLoader() {
  return (
    <div className="grid min-h-[40vh] place-items-center px-6 text-center">
      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--background-elevated)] px-8 py-6">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
          Loading Module
        </div>
        <div className="mt-3 text-lg font-semibold text-[var(--text-primary)]">
          Preparing the next workspace...
        </div>
      </div>
    </div>
  );
}

const LoginPage = lazyPage(() => import("../pages/login/LoginPage.jsx"), "LoginPage");
const ResetPasswordPage = lazyPage(
  () => import("../pages/reset-password/ResetPasswordPage.jsx"),
  "ResetPasswordPage"
);
const DashboardPage = lazyPage(
  () => import("../pages/dashboard/DashboardPage.jsx"),
  "DashboardPage"
);
const MonitoringPage = lazyPage(
  () => import("../pages/monitoring/MonitoringPage.jsx"),
  "MonitoringPage"
);
const DevicesPage = lazyPage(() => import("../pages/devices/DevicesPage.jsx"), "DevicesPage");
const AlertsPage = lazyPage(() => import("../pages/alerts/AlertsPage.jsx"), "AlertsPage");
const ReportsPage = lazyPage(() => import("../pages/reports/ReportsPage.jsx"), "ReportsPage");
const UsersPage = lazyPage(() => import("../pages/users/UsersPage.jsx"), "UsersPage");
const SettingsPage = lazyPage(
  () => import("../pages/settings/SettingsPage.jsx"),
  "SettingsPage"
);
const ProfilePage = lazyPage(() => import("../pages/profile/ProfilePage.jsx"), "ProfilePage");
const NotFoundPage = lazyPage(
  () => import("../pages/errors/NotFoundPage.jsx"),
  "NotFoundPage"
);

export function AppRouter() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path={ROUTE_PATHS.root} element={<Navigate to={ROUTE_PATHS.dashboard} replace />} />

        <Route element={<AuthLayout />}>
          <Route path={ROUTE_PATHS.login} element={<LoginPage />} />
          <Route path={ROUTE_PATHS.resetPassword} element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path={ROUTE_PATHS.dashboard} element={<DashboardPage />} />
            <Route path={ROUTE_PATHS.monitoring} element={<MonitoringPage />} />
            <Route path={ROUTE_PATHS.devices} element={<DevicesPage />} />
            <Route path={ROUTE_PATHS.alerts} element={<AlertsPage />} />
            <Route path={ROUTE_PATHS.reports} element={<ReportsPage />} />
            <Route path={ROUTE_PATHS.settings} element={<SettingsPage />} />
            <Route path={ROUTE_PATHS.profile} element={<ProfilePage />} />

            <Route
              element={
                <RoleRoute
                  allowedRoles={[APP_ROLES.SUPER_ADMIN]}
                />
              }
            >
              <Route path={ROUTE_PATHS.users} element={<UsersPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
