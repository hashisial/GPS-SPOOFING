import { ROUTE_PATHS } from "../routes/route-paths.js";
import { APP_ROLES } from "../utils/constants/app.constants.js";

export const navigation = {
  public: [
    {
      label: "Login",
      path: ROUTE_PATHS.login
    }
  ],
  primary: [
    {
      label: "Dashboard",
      path: ROUTE_PATHS.dashboard,
      description: "Overview of spoofing activity and fleet health",
      roles: Object.values(APP_ROLES)
    },
    {
      label: "Monitoring",
      path: ROUTE_PATHS.monitoring,
      description: "Live device positions, routes, and telemetry",
      roles: Object.values(APP_ROLES)
    },
    {
      label: "Devices",
      path: ROUTE_PATHS.devices,
      description: "Manage and inspect tracking devices",
      roles: Object.values(APP_ROLES)
    },
    {
      label: "Alerts",
      path: ROUTE_PATHS.alerts,
      description: "Investigate spoofing alerts and status",
      roles: Object.values(APP_ROLES)
    },
    {
      label: "Reports",
      path: ROUTE_PATHS.reports,
      description: "Generate and export operational reports",
      roles: Object.values(APP_ROLES)
    },
    {
      label: "Users",
      path: ROUTE_PATHS.users,
      description: "User and role administration",
      roles: [APP_ROLES.SUPER_ADMIN]
    }
  ],
  secondary: [
    {
      label: "Settings",
      path: ROUTE_PATHS.settings,
      description: "Thresholds, preferences, and app controls",
      roles: Object.values(APP_ROLES)
    },
    {
      label: "Profile",
      path: ROUTE_PATHS.profile,
      description: "Signed-in user profile workspace",
      roles: Object.values(APP_ROLES)
    }
  ]
};
