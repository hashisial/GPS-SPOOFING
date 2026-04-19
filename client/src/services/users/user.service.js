import { httpClient } from "../api/httpClient.js";

export const userService = {
  list(params) {
    return httpClient.get("/users", { params });
  },
  getById(userId) {
    return httpClient.get(`/users/${userId}`);
  },
  create(payload) {
    return httpClient.post("/users", payload);
  },
  update(userId, payload) {
    return httpClient.patch(`/users/${userId}`, payload);
  },
  block(userId, payload = {}) {
    return httpClient.patch(`/users/${userId}/block`, payload);
  },
  unblock(userId) {
    return httpClient.patch(`/users/${userId}/unblock`);
  },
  remove(userId) {
    return httpClient.delete(`/users/${userId}`);
  }
};
