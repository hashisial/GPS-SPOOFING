import { describe, expect, it, vi } from "vitest";
import { sanitizeRequestMiddleware } from "./sanitize.middleware.js";

describe("sanitizeRequestMiddleware", () => {
  it("removes script payloads and mongo operator keys", () => {
    const req = {
      body: {
        name: '  <script>alert("x")</script>Device Alpha  ',
        nested: {
          safe: "  ok  ",
          $where: "malicious",
          "profile.bio": "bad"
        }
      },
      query: {
        search: " <b>alerts</b> "
      },
      params: {
        userId: " user-1 "
      }
    };
    const next = vi.fn();

    sanitizeRequestMiddleware(req, {}, next);

    expect(req.body).toEqual({
      name: "Device Alpha",
      nested: {
        safe: "ok"
      }
    });
    expect(req.query.search).toBe("alerts");
    expect(req.params.userId).toBe("user-1");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("preserves raw credential strings while trimming them", () => {
    const req = {
      body: {
        password: "  Pa$$<script>word  ",
        token: "  abc.def.ghi  "
      },
      query: {},
      params: {}
    };
    const next = vi.fn();

    sanitizeRequestMiddleware(req, {}, next);

    expect(req.body.password).toBe("Pa$$<script>word");
    expect(req.body.token).toBe("abc.def.ghi");
    expect(next).toHaveBeenCalledTimes(1);
  });
});
