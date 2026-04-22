const fallbackApiBaseUrl = "http://localhost:5000/api/v1";
const fallbackSocketUrl = "http://localhost:5000";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const configuredDemoMode = import.meta.env.VITE_ENABLE_DEMO?.trim();
const useDemoApi =
  configuredDemoMode === "true" ||
  (configuredDemoMode !== "false" && import.meta.env.PROD && !configuredApiBaseUrl);

export const env = {
  appName: import.meta.env.VITE_APP_NAME ?? "GPS Spoofing Detection Dashboard",
  apiBaseUrl: configuredApiBaseUrl || fallbackApiBaseUrl,
  socketUrl: import.meta.env.VITE_SOCKET_URL?.trim() || fallbackSocketUrl,
  useDemoApi
};
