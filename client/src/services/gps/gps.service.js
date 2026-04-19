import { httpClient } from "../api/httpClient.js";

export const gpsService = {
  getLiveMonitoring(params) {
    return httpClient.get("/gps/live", { params });
  },
  ingestData(payload) {
    return httpClient.post("/gps/data", payload);
  }
};
