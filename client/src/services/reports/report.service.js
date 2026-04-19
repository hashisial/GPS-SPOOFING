import { httpClient } from "../api/httpClient.js";

export const reportService = {
  list(params) {
    return httpClient.get("/reports", { params });
  },
  generate(payload) {
    return httpClient.post("/reports", payload);
  },
  getById(reportId) {
    return httpClient.get(`/reports/${reportId}`);
  },
  export(reportId, format) {
    return httpClient.get(`/reports/${reportId}/export`, {
      params: { format },
      responseType: "blob"
    });
  }
};
