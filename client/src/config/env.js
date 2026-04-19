export const env = {
  appName: import.meta.env.VITE_APP_NAME ?? "GPS Spoofing Detection Dashboard",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api/v1",
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? "http://localhost:5000"
};
