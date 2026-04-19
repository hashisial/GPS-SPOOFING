import prisma from "../config/db.js";
import { AlertStatuses } from "../constants/roles.js";
import { createHttpError } from "../utils/http-error.js";
import { logger } from "../utils/logger.js";
import { buildPaginationMeta, getPagination } from "../utils/pagination.js";
import { evaluateSpoofing } from "./spoofing.service.js";

function serializeGpsLog(log) {
  return {
    id: log.id,
    deviceId: log.deviceId,
    latitude: log.latitude,
    longitude: log.longitude,
    speedKph: log.speedKph,
    headingDegrees: log.headingDegrees,
    signalStrength: log.signalStrength,
    accuracyMeters: log.accuracyMeters,
    satelliteCount: log.satelliteCount,
    timestamp: log.timestamp,
    isSpoofed: log.isSpoofed,
    spoofingScore: log.spoofingScore,
    anomalyFlags: log.anomalyFlags,
    device: log.device
      ? {
          id: log.device.id,
          callsign: log.device.callsign,
          label: log.device.label,
          status: log.device.status
        }
      : null,
    alert: log.alert ? serializeAlert(log.alert) : null
  };
}

function serializeAlert(alert) {
  return {
    id: alert.id,
    deviceId: alert.deviceId,
    gpsLogId: alert.gpsLogId,
    severity: alert.severity,
    status: alert.status,
    title: alert.title,
    description: alert.description,
    triggeredRules: alert.triggeredRules,
    confidence: alert.confidence,
    computedSpeedKph: alert.computedSpeedKph,
    distanceJumpMeters: alert.distanceJumpMeters,
    signalDelta: alert.signalDelta,
    accuracyMeters: alert.accuracyMeters,
    detectedAt: alert.detectedAt,
    device: alert.device
      ? {
          id: alert.device.id,
          callsign: alert.device.callsign,
          label: alert.device.label,
          status: alert.device.status
        }
      : null
  };
}

function buildHistoryWhereClause(filters = {}) {
  const where = {};

  if (filters.deviceId) {
    where.deviceId = filters.deviceId;
  }

  if (filters.from || filters.to) {
    where.timestamp = {};

    if (filters.from) {
      where.timestamp.gte = filters.from;
    }

    if (filters.to) {
      where.timestamp.lte = filters.to;
    }
  }

  if (filters.spoofedOnly) {
    where.isSpoofed = true;
  }

  return where;
}

export async function ingestGpsData(payload) {
  const device = await prisma.device.findUnique({
    where: {
      id: payload.deviceId
    },
    select: {
      id: true,
      callsign: true,
      label: true,
      status: true
    }
  });

  if (!device) {
    throw createHttpError(404, "Device not found.");
  }

  const previousLog = await prisma.gpsLog.findFirst({
    where: {
      deviceId: payload.deviceId
    },
    orderBy: {
      timestamp: "desc"
    }
  });

  const spoofingResult = evaluateSpoofing(payload, previousLog);

  const transactionResult = await prisma.$transaction(async (tx) => {
    const gpsLog = await tx.gpsLog.create({
      data: {
        deviceId: payload.deviceId,
        latitude: payload.latitude,
        longitude: payload.longitude,
        speedKph: payload.speedKph ?? null,
        headingDegrees: payload.headingDegrees ?? null,
        signalStrength: payload.signalStrength ?? null,
        accuracyMeters: payload.accuracyMeters ?? null,
        satelliteCount: payload.satelliteCount ?? null,
        timestamp: payload.timestamp,
        isSpoofed: spoofingResult.isSpoofed,
        spoofingScore: spoofingResult.confidence,
        anomalyFlags: spoofingResult.triggeredRules,
        rawPayload: payload.rawPayload ?? null
      },
      include: {
        device: true
      }
    });

    await tx.device.update({
      where: {
        id: payload.deviceId
      },
      data: {
        lastKnownLat: payload.latitude,
        lastKnownLng: payload.longitude,
        lastSeenAt: payload.timestamp
      }
    });

    let alert = null;

    if (spoofingResult.isSpoofed) {
      alert = await tx.alert.create({
        data: {
          deviceId: payload.deviceId,
          gpsLogId: gpsLog.id,
          severity: spoofingResult.severity,
          status: AlertStatuses.OPEN,
          title: `Spoofing detected for ${device.callsign}`,
          description: spoofingResult.description,
          triggeredRules: spoofingResult.triggeredRules,
          confidence: spoofingResult.confidence,
          computedSpeedKph: spoofingResult.computedSpeedKph,
          distanceJumpMeters: spoofingResult.distanceJumpMeters,
          signalDelta: spoofingResult.signalDelta,
          accuracyMeters: spoofingResult.accuracyMeters,
          metadata: {
            previousLogId: previousLog?.id ?? null
          }
        },
        include: {
          device: true
        }
      });
    }

    return {
      gpsLog,
      alert
    };
  });

  logger.info("gps_log_ingested", {
    deviceId: payload.deviceId,
    gpsLogId: transactionResult.gpsLog.id,
    spoofed: transactionResult.gpsLog.isSpoofed
  });

  if (transactionResult.alert) {
    logger.warn("spoofing_alert_created", {
      alertId: transactionResult.alert.id,
      deviceId: transactionResult.alert.deviceId,
      rules: transactionResult.alert.triggeredRules
    });
  }

  return {
    gpsLog: serializeGpsLog(transactionResult.gpsLog),
    alert: transactionResult.alert ? serializeAlert(transactionResult.alert) : null
  };
}

export async function getLiveGpsFeed({ deviceId, limit = 25 } = {}) {
  const logs = await prisma.gpsLog.findMany({
    where: {
      ...(deviceId ? { deviceId } : {})
    },
    take: limit,
    orderBy: {
      timestamp: "desc"
    },
    include: {
      device: true,
      alert: {
        include: {
          device: true
        }
      }
    }
  });

  return logs.map(serializeGpsLog);
}

export async function getGpsHistory(filters = {}) {
  const pagination = getPagination(filters.page, filters.pageSize);
  const where = buildHistoryWhereClause(filters);

  const [total, logs] = await prisma.$transaction([
    prisma.gpsLog.count({ where }),
    prisma.gpsLog.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: {
        timestamp: "desc"
      },
      include: {
        device: true,
        alert: {
          include: {
            device: true
          }
        }
      }
    })
  ]);

  return {
    data: logs.map(serializeGpsLog),
    pagination: buildPaginationMeta(total, pagination.page, pagination.pageSize)
  };
}
