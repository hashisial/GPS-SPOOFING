import { httpClient } from "../api/httpClient.js";

export const settingsService = {
  get() {
    return httpClient.get("/settings");
  },
  update(payload) {
    return httpClient.patch("/settings", payload);
  }
};
