import { httpClient } from "../api/httpClient.js";

export const alertService = {
  list(params) {
    return httpClient.get("/alerts", { params });
  },
  getById(alertId) {
    return httpClient.get(`/alerts/${alertId}`);
  },
  resolve(alertId, payload = {}) {
    return httpClient.patch(`/alerts/${alertId}/resolve`, payload);
  },
  markFalsePositive(alertId, payload) {
    return httpClient.patch(`/alerts/${alertId}/false-positive`, payload);
  },
  escalate(alertId, payload = {}) {
    return httpClient.patch(`/alerts/${alertId}/escalate`, payload);
  },
  remove(alertId) {
    return httpClient.delete(`/alerts/${alertId}`);
  }
};
