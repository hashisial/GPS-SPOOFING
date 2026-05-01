import { DeviceModel } from "../../models/Device.js";
import { ApiError } from "../../utils/ApiError.js";
import { generateRandomToken, hashToken } from "../../utils/crypto.js";

const DEVICE_API_KEY_PREFIX = "gpsdk";

function sanitizeDevice(device) {
  return typeof device.toObject === "function" ? device.toObject() : device;
}

async function ensureDeviceExists(deviceMongoId) {
  const device = await DeviceModel.findById(deviceMongoId).populate(
    "owner",
    "name email role isActive"
  );

  if (!device) {
    throw ApiError.notFound("Device not found");
  }

  return device;
}

function buildPlaintextDeviceApiKey() {
  return `${DEVICE_API_KEY_PREFIX}_${generateRandomToken(24)}`;
}

export async function provisionDeviceApiKey(deviceMongoId, actor) {
  const device = await ensureDeviceExists(deviceMongoId);
  const deviceApiKey = buildPlaintextDeviceApiKey();

  device.deviceApiKeyHash = hashToken(deviceApiKey);
  device.deviceApiKeyLastFour = deviceApiKey.slice(-4);
  device.deviceApiKeyIssuedAt = new Date();
  device.updatedBy = actor?.id ?? null;

  await device.save();

  return {
    device: sanitizeDevice(device),
    deviceApiKey
  };
}
