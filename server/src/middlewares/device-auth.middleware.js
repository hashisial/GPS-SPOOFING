import { timingSafeEqual } from "node:crypto";
import { DEVICE_STATUS } from "../constants/device.js";
import { DeviceModel } from "../models/Device.js";
import { ApiError } from "../utils/ApiError.js";
import { hashToken } from "../utils/crypto.js";

function normalizeHeaderValue(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeDeviceId(value) {
  return normalizeHeaderValue(value).toUpperCase();
}

function extractDeviceId(req) {
  const headerDeviceId = normalizeDeviceId(req.headers["x-device-id"]);

  if (headerDeviceId) {
    return headerDeviceId;
  }

  if (typeof req.body?.deviceId === "string") {
    return normalizeDeviceId(req.body.deviceId);
  }

  return "";
}

function extractDeviceKey(req) {
  return (
    normalizeHeaderValue(req.headers["x-device-key"]) ||
    normalizeHeaderValue(req.headers["x-api-key"])
  );
}

function safeEqualHexStrings(left, right) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function authenticateDevice(req, _res, next) {
  try {
    const deviceId = extractDeviceId(req);
    const deviceKey = extractDeviceKey(req);

    if (!deviceId || !deviceKey) {
      return next(
        ApiError.unauthorized("Device authentication requires x-device-id and x-device-key")
      );
    }

    const device = await DeviceModel.findOne({
      deviceId
    }).select("+deviceApiKeyHash");

    if (!device?.deviceApiKeyHash) {
      return next(ApiError.unauthorized("Device credentials are invalid"));
    }

    if (!safeEqualHexStrings(hashToken(deviceKey), device.deviceApiKeyHash)) {
      return next(ApiError.unauthorized("Device credentials are invalid"));
    }

    if (device.status === DEVICE_STATUS.DISABLED) {
      return next(ApiError.forbidden("Device is disabled"));
    }

    req.deviceAuth = {
      id: device.id,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      type: device.type,
      status: device.status
    };

    return next();
  } catch (error) {
    return next(error);
  }
}
