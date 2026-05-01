import { beforeEach, describe, expect, it, vi } from "vitest";

const { findOneMock, selectMock } = vi.hoisted(() => ({
  findOneMock: vi.fn(),
  selectMock: vi.fn()
}));

vi.mock("../models/Device.js", () => ({
  DeviceModel: {
    findOne: findOneMock
  }
}));

vi.mock("../utils/crypto.js", () => ({
  hashToken: vi.fn((value) => `hash:${value}`)
}));

import { authenticateDevice } from "./device-auth.middleware.js";

describe("authenticateDevice", () => {
  beforeEach(() => {
    findOneMock.mockReset();
    selectMock.mockReset();
  });

  it("rejects requests with missing device headers", async () => {
    const req = {
      headers: {},
      body: {}
    };
    const next = vi.fn();

    await authenticateDevice(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it("authenticates a device with a valid API key", async () => {
    findOneMock.mockReturnValue({
      select: selectMock
    });
    selectMock.mockResolvedValue({
      id: "mongo-device-id",
      deviceId: "FIELD-TEST-001",
      deviceName: "Field Test Tracker",
      type: "TRACKER",
      status: "ONLINE",
      deviceApiKeyHash: "hash:super-secret-key"
    });

    const req = {
      headers: {
        "x-device-id": "field-test-001",
        "x-device-key": "super-secret-key"
      },
      body: {}
    };
    const next = vi.fn();

    await authenticateDevice(req, {}, next);

    expect(findOneMock).toHaveBeenCalledWith({
      deviceId: "FIELD-TEST-001"
    });
    expect(req.deviceAuth).toEqual({
      id: "mongo-device-id",
      deviceId: "FIELD-TEST-001",
      deviceName: "Field Test Tracker",
      type: "TRACKER",
      status: "ONLINE"
    });
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects invalid device API keys", async () => {
    findOneMock.mockReturnValue({
      select: selectMock
    });
    selectMock.mockResolvedValue({
      id: "mongo-device-id",
      deviceId: "FIELD-TEST-001",
      deviceName: "Field Test Tracker",
      type: "TRACKER",
      status: "ONLINE",
      deviceApiKeyHash: "hash:correct-key"
    });

    const req = {
      headers: {
        "x-device-id": "FIELD-TEST-001",
        "x-device-key": "wrong-key"
      },
      body: {}
    };
    const next = vi.fn();

    await authenticateDevice(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
    expect(next.mock.calls[0][0].message).toBe("Device credentials are invalid");
  });
});
