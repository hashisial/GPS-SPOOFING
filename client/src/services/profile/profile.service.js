import { httpClient } from "../api/httpClient.js";

export const profileService = {
  get() {
    return httpClient.get("/profile");
  },
  update(payload) {
    return httpClient.patch("/profile", payload);
  }
};
