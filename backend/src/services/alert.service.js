import prisma from "../config/db.js";
import { buildPaginationMeta, getPagination } from "../utils/pagination.js";

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
      : null,
    gpsLog: alert.gpsLog
      ? {
          id: alert.gpsLog.id,
          latitude: alert.gpsLog.latitude,
          longitude: alert.gpsLog.longitude,
          timestamp: alert.gpsLog.timestamp
        }
      : null
  };
}

export async function listAlerts(filters = {}) {
  const pagination = getPagination(filters.page, filters.pageSize);
  const where = {
    ...(filters.deviceId ? { deviceId: filters.deviceId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.severity ? { severity: filters.severity } : {})
  };

  const [total, alerts] = await prisma.$transaction([
    prisma.alert.count({ where }),
    prisma.alert.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: {
        detectedAt: "desc"
      },
      include: {
        device: true,
        gpsLog: true
      }
    })
  ]);

  return {
    data: alerts.map(serializeAlert),
    pagination: buildPaginationMeta(total, pagination.page, pagination.pageSize)
  };
}
