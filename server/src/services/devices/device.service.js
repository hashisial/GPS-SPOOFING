import { DEVICE_ONLINE_FILTER, DEVICE_STATUS } from "../../constants/device.js";
import { DeviceModel } from "../../models/Device.js";
import { UserModel } from "../../models/User.js";
import { ApiError } from "../../utils/ApiError.js";

function sanitizeDevice(device) {
  return typeof device.toObject === "function" ? device.toObject() : device;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeUniqueValue(value) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function buildSearchQuery(search) {
  if (!search) {
    return {};
  }

  const pattern = new RegExp(escapeRegExp(search), "i");

  return {
    $or: [
      { deviceName: pattern },
      { deviceId: pattern },
      { notes: pattern }
    ]
  };
}

async function ensureDeviceExists(deviceMongoId) {
  const device = await DeviceModel.findById(deviceMongoId).populate("owner", "name email role isActive");

  if (!device) {
    throw ApiError.notFound("Device not found");
  }

  return device;
}

async function ensureAssignableUser(userId) {
  if (!userId) {
    return null;
  }

  const user = await UserModel.findById(userId);

  if (!user) {
    throw ApiError.notFound("Assigned user not found");
  }

  if (!user.isActive) {
    throw ApiError.badRequest("Assigned user must be active");
  }

  return user;
}

async function ensureUniqueFields(payload, excludingDeviceId = null) {
  const checks = [{
    field: "deviceId",
    value: typeof payload.deviceId === "string" ? payload.deviceId.toUpperCase() : null,
    message: "A device with this deviceId already exists"
  }];

  for (const check of checks) {
    if (!check.value) {
      continue;
    }

    const query = {
      [check.field]: check.value
    };

    if (excludingDeviceId) {
      query._id = { $ne: excludingDeviceId };
    }

    const existingDevice = await DeviceModel.findOne(query);

    if (existingDevice) {
      throw ApiError.conflict(check.message);
    }
  }
}

function applyDevicePatch(device, payload, actor) {
  if (payload.deviceName !== undefined) {
    device.deviceName = payload.deviceName;
  }

  if (payload.deviceId !== undefined) {
    device.deviceId = payload.deviceId.toUpperCase();
  }

  if (payload.type !== undefined) {
    device.type = payload.type;
  }

  if (payload.status !== undefined) {
    device.status = payload.status;
  }

  if (payload.owner !== undefined) {
    device.owner = payload.owner ?? null;
  }

  if (payload.lastSeen !== undefined) {
    device.lastSeen = payload.lastSeen ?? null;
  }

  if (payload.notes !== undefined) {
    device.notes = normalizeUniqueValue(payload.notes);
  }

  device.updatedBy = actor?.id ?? null;
}

export async function listDevices(query = {}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;

  const filters = {
    ...buildSearchQuery(query.search)
  };

  if (query.status) {
    filters.status = query.status;
  }

  if (query.type) {
    filters.type = query.type;
  }

  if (query.owner) {
    filters.owner = query.owner;
  }

  if (query.online === DEVICE_ONLINE_FILTER.ONLINE) {
    filters.status = DEVICE_STATUS.ONLINE;
  }

  if (query.online === DEVICE_ONLINE_FILTER.OFFLINE) {
    filters.status = DEVICE_STATUS.OFFLINE;
  }

  const sortDirection = query.sortOrder === "asc" ? 1 : -1;
  const sort = {
    [query.sortBy ?? "createdAt"]: sortDirection
  };

  const [items, total] = await Promise.all([
    DeviceModel.find(filters)
      .populate("owner", "name email role isActive")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    DeviceModel.countDocuments(filters)
  ]);

  return {
    data: items.map((device) => sanitizeDevice(device)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

export async function getDeviceById(deviceMongoId) {
  const device = await ensureDeviceExists(deviceMongoId);
  return sanitizeDevice(device);
}

export async function createDevice(payload, actor) {
  await ensureUniqueFields(payload);
  await ensureAssignableUser(payload.owner);

  const device = await DeviceModel.create({
    deviceName: payload.deviceName,
    deviceId: payload.deviceId.toUpperCase(),
    type: payload.type,
    owner: payload.owner ?? null,
    status: payload.status ?? DEVICE_STATUS.OFFLINE,
    lastSeen: payload.lastSeen ?? null,
    notes: normalizeUniqueValue(payload.notes),
    createdBy: actor?.id ?? null,
    updatedBy: actor?.id ?? null
  });

  const createdDevice = await DeviceModel.findById(device.id).populate("owner", "name email role isActive");

  return sanitizeDevice(createdDevice);
}

export async function updateDevice(deviceMongoId, payload, actor) {
  const device = await ensureDeviceExists(deviceMongoId);

  await ensureUniqueFields(payload, device.id);
  await ensureAssignableUser(payload.owner);

  applyDevicePatch(device, payload, actor);
  await device.save();
  await device.populate("owner", "name email role isActive");

  return sanitizeDevice(device);
}

export async function deleteDevice(deviceMongoId) {
  const device = await ensureDeviceExists(deviceMongoId);

  await DeviceModel.deleteOne({ _id: device.id });

  return {
    id: device.id
  };
}
