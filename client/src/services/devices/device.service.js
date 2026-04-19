import { httpClient } from "../api/httpClient.js";

export const deviceService = {
  list(params) {
    return httpClient.get("/devices", { params });
  },
  getById(deviceId) {
    return httpClient.get(`/devices/${deviceId}`);
  },
  create(payload) {
    return httpClient.post("/devices", payload);
  },
  update(deviceId, payload) {
    return httpClient.patch(`/devices/${deviceId}`, payload);
  },
  remove(deviceId) {
    return httpClient.delete(`/devices/${deviceId}`);
  }
};
