import { httpClient } from "../api/httpClient.js";

export const dashboardService = {
  getOverview() {
    return httpClient.get("/dashboard/overview");
  }
};
