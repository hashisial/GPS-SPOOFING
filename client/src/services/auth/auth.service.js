import { httpClient } from "../api/httpClient.js";

export const authService = {
  login(payload) {
    return httpClient.post("/auth/login", payload);
  },
  forgotPassword(payload) {
    return httpClient.post("/auth/forgot-password", payload);
  },
  resetPassword(payload) {
    return httpClient.post("/auth/reset-password", payload);
  },
  register(payload) {
    return httpClient.post("/auth/register", payload);
  },
  getCurrentUser() {
    return httpClient.get("/auth/me");
  },
  refreshSession(payload = {}) {
    return httpClient.post("/auth/refresh-token", payload);
  },
  logout(payload = {}) {
    return httpClient.post("/auth/logout", payload);
  }
};
