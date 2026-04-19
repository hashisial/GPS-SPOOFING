import { describe, expect, it } from "vitest";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.PORT = "5000";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/gps-spoofing-test";
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

const { app } = await import("./app.js");

describe("Express app", () => {
  it("serves the root status endpoint", async () => {
    const response = await request(app)
      .get("/")
      .expect(200);

    expect(response.body).toEqual({
      service: "gps-spoofing-detection-server",
      status: "running"
    });
    expect(response.headers["x-request-id"]).toBeTruthy();
  });

  it("serves the API health endpoint", async () => {
    const response = await request(app)
      .get("/api/v1/health")
      .expect(200);

    expect(response.body.status).toBe("ok");
    expect(response.body.database.state).toBeDefined();
  });

  it("returns JSON 404 responses for unknown routes", async () => {
    const response = await request(app)
      .get("/api/v1/does-not-exist")
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Route not found: GET /api/v1/does-not-exist");
  });
});
