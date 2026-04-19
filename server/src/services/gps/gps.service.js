import { env } from "../../config/env.js";
import { DEVICE_STATUS } from "../../constants/device.js";
import { logger } from "../../config/logger.js";
import { DeviceModel } from "../../models/Device.js";
import { GpsLogModel } from "../../models/GpsLog.js";
import { emitGpsMovement } from "../../sockets/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { evaluateGpsLogForSpoofing } from "../detection/spoofingDetection.service.js";

function sanitizeGpsLog(log) {
  return typeof log.toObject === "function" ? log.toObject() : log;
}

function normalizeDeviceId(deviceId) {
  return deviceId.trim().toUpperCase();
}

function sanitizeOwner(owner) {
  if (!owner) {
    return null;
  }

  return {
    id: owner._id?.toString?.() ?? owner.id ?? null,
    name: owner.name,
    email: owner.email,
    role: owner.role
  };
}

function isDeviceOnline(device) {
  if (!device?.lastSeen) {
    return false;
  }

  if (device.status === DEVICE_STATUS.DISABLED) {
    return false;
  }

  return Date.now() - new Date(device.lastSeen).getTime() <= env.deviceOnlineWindowMs;
}

function mapLiveDevice(device, latestLog, trail = []) {
  const online = isDeviceOnline(device);

  return {
    id: device._id?.toString?.() ?? device.id,
    deviceId: device.deviceId,
    deviceName: device.deviceName,
    type: device.type,
    status: device.status,
    isOnline: online,
    owner: sanitizeOwner(device.owner),
    lastSeen: device.lastSeen,
    position: latestLog
      ? {
          latitude: latestLog.latitude,
          longitude: latestLog.longitude,
          speed: latestLog.speed,
          accuracy: latestLog.accuracy,
          heading: latestLog.heading,
          timestamp: latestLog.timestamp
        }
      : null,
    trail: trail
      .slice()
      .reverse()
      .map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
        speed: point.speed,
        accuracy: point.accuracy,
        heading: point.heading,
        timestamp: point.timestamp
      }))
  };
}

async function buildLiveDeviceSnapshot(deviceMongoId, trailLimit = 14) {
  const device = await DeviceModel.findById(deviceMongoId)
    .populate("owner", "name email role")
    .lean();

  if (!device) {
    return null;
  }

  const logs = await GpsLogModel.find({
    device: deviceMongoId
  })
    .sort({ timestamp: -1 })
    .limit(trailLimit)
    .lean();

  return mapLiveDevice(device, logs[0] ?? null, logs);
}

async function resolveDevice(deviceId) {
  const normalizedDeviceId = normalizeDeviceId(deviceId);
  const device = await DeviceModel.findOne({ deviceId: normalizedDeviceId });

  if (!device) {
    throw ApiError.notFound("Device not found");
  }

  if (device.status === DEVICE_STATUS.DISABLED) {
    throw ApiError.badRequest("Device is disabled and cannot send GPS data");
  }

  return device;
}

async function ensureNotDuplicate(device, payload) {
  const duplicateThreshold = new Date(Date.now() - env.gpsDuplicateWindowMs);

  const duplicateLog = await GpsLogModel.findOne({
    device: device.id,
    deviceId: device.deviceId,
    latitude: payload.latitude,
    longitude: payload.longitude,
    speed: payload.speed,
    accuracy: payload.accuracy,
    heading: payload.heading,
    timestamp: payload.timestamp,
    receivedAt: {
      $gte: duplicateThreshold
    }
  }).sort({ receivedAt: -1 });

  if (duplicateLog) {
    throw ApiError.conflict("Duplicate GPS payload detected");
  }
}

async function updateDeviceLastSeen(device, timestamp) {
  device.lastSeen = timestamp;

  if (device.status === DEVICE_STATUS.OFFLINE) {
    device.status = DEVICE_STATUS.ONLINE;
  }

  await device.save();
}

export async function ingestGpsData(payload) {
  const device = await resolveDevice(payload.deviceId);

  await ensureNotDuplicate(device, payload);

  const gpsLog = await GpsLogModel.create({
    device: device.id,
    deviceId: device.deviceId,
    latitude: payload.latitude,
    longitude: payload.longitude,
    speed: payload.speed,
    accuracy: payload.accuracy,
    heading: payload.heading,
    timestamp: payload.timestamp
  });

  await updateDeviceLastSeen(device, payload.timestamp);

  let detection = {
    detected: false,
    riskScore: 0,
    severity: null,
    findings: [],
    alert: null
  };

  try {
    detection = await evaluateGpsLogForSpoofing({
      device,
      gpsLog
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        deviceId: device.deviceId,
        gpsLogId: gpsLog.id
      },
      "GPS spoofing detection processing failed"
    );
  }

  const liveDevice = await buildLiveDeviceSnapshot(device.id);

  if (liveDevice) {
    emitGpsMovement({
      device: liveDevice
    });
  }

  return {
    gpsLog: sanitizeGpsLog(gpsLog),
    detection
  };
}

export async function getLiveMonitoringData(query = {}) {
  const deviceFilters = {};

  if (query.deviceId) {
    deviceFilters.deviceId = normalizeDeviceId(query.deviceId);
  }

  const devices = await DeviceModel.find(deviceFilters)
    .populate("owner", "name email role")
    .sort({ deviceName: 1 })
    .lean();

  const deviceIds = devices.map((device) => device._id);

  if (deviceIds.length === 0) {
    return {
      summary: {
        totalDevices: 0,
        onlineDevices: 0,
        offlineDevices: 0,
        activeMarkers: 0
      },
      devices: []
    };
  }

  const trailLimit = query.trailLimit ?? 12;
  const liveLogs = await GpsLogModel.aggregate([
    {
      $match: {
        device: {
          $in: deviceIds
        }
      }
    },
    {
      $sort: {
        device: 1,
        timestamp: -1
      }
    },
    {
      $group: {
        _id: "$device",
        latestLog: {
          $first: {
            latitude: "$latitude",
            longitude: "$longitude",
            speed: "$speed",
            accuracy: "$accuracy",
            heading: "$heading",
            timestamp: "$timestamp"
          }
        },
        trail: {
          $push: {
            latitude: "$latitude",
            longitude: "$longitude",
            speed: "$speed",
            accuracy: "$accuracy",
            heading: "$heading",
            timestamp: "$timestamp"
          }
        }
      }
    },
    {
      $project: {
        latestLog: 1,
        trail: {
          $slice: ["$trail", trailLimit]
        }
      }
    }
  ]);

  const liveLogMap = new Map(
    liveLogs.map((entry) => [entry._id.toString(), entry])
  );

  const mappedDevices = devices
    .map((device) => {
      const liveEntry = liveLogMap.get(device._id.toString());
      return mapLiveDevice(
        device,
        liveEntry?.latestLog ?? null,
        liveEntry?.trail ?? []
      );
    })
    .filter((device) => {
      if (query.status === "ONLINE") {
        return device.isOnline;
      }

      if (query.status === "OFFLINE") {
        return !device.isOnline;
      }

      return true;
    })
    .sort((left, right) => {
      if (left.isOnline !== right.isOnline) {
        return left.isOnline ? -1 : 1;
      }

      return left.deviceName.localeCompare(right.deviceName);
    });

  const onlineDevices = mappedDevices.filter((device) => device.isOnline).length;
  const activeMarkers = mappedDevices.filter((device) => Boolean(device.position)).length;
  const latestTimestamp = mappedDevices.reduce((latest, device) => {
    const timestamp = device.position?.timestamp;

    if (!timestamp) {
      return latest;
    }

    if (!latest) {
      return timestamp;
    }

    return new Date(timestamp) > new Date(latest) ? timestamp : latest;
  }, null);

  return {
    summary: {
      totalDevices: mappedDevices.length,
      onlineDevices,
      offlineDevices: mappedDevices.length - onlineDevices,
      activeMarkers,
      deviceOnlineWindowMs: env.deviceOnlineWindowMs,
      latestTimestamp
    },
    devices: mappedDevices
  };
}
