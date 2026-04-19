import prisma from "../config/db.js";
import { DetectionStatuses } from "../constants/roles.js";
import { createHttpError } from "../utils/http-error.js";
import { buildPaginationMeta, getPagination } from "../utils/pagination.js";

function serializeDetection(detection) {
  return {
    id: detection.id,
    severity: detection.severity,
    status: detection.status,
    confidence: detection.confidence,
    authenticLat: detection.authenticLat,
    authenticLng: detection.authenticLng,
    spoofedLat: detection.spoofedLat,
    spoofedLng: detection.spoofedLng,
    driftMeters: detection.driftMeters,
    headingDelta: detection.headingDelta,
    description: detection.description,
    detectedAt: detection.detectedAt,
    telemetry: detection.telemetry,
    device: detection.device,
    createdBy: detection.createdBy
      ? {
          id: detection.createdBy.id,
          name: detection.createdBy.name,
          role: detection.createdBy.role
        }
      : null
  };
}

function buildDetectionWhereClause(filters = {}) {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.severity) {
    where.severity = filters.severity;
  }

  if (filters.search) {
    where.OR = [
      {
        description: {
          contains: filters.search,
          mode: "insensitive"
        }
      },
      {
        device: {
          callsign: {
            contains: filters.search,
            mode: "insensitive"
          }
        }
      },
      {
        device: {
          label: {
            contains: filters.search,
            mode: "insensitive"
          }
        }
      }
    ];
  }

  return where;
}

function baseDetectionSelect() {
  return {
    id: true,
    severity: true,
    status: true,
    confidence: true,
    authenticLat: true,
    authenticLng: true,
    spoofedLat: true,
    spoofedLng: true,
    driftMeters: true,
    headingDelta: true,
    description: true,
    detectedAt: true,
    telemetry: true,
    device: {
      select: {
        id: true,
        callsign: true,
        label: true,
        fleet: true,
        status: true
      }
    },
    createdBy: {
      select: {
        id: true,
        name: true,
        role: true
      }
    }
  };
}

export async function listDetections(filters = {}) {
  const pagination = getPagination(filters.page, filters.pageSize ?? filters.limit ?? 20);
  const where = buildDetectionWhereClause(filters);

  const [total, detections] = await prisma.$transaction([
    prisma.detection.count({ where }),
    prisma.detection.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: {
        detectedAt: "desc"
      },
      select: baseDetectionSelect()
    })
  ]);

  return {
    data: detections.map(serializeDetection),
    pagination: buildPaginationMeta(total, pagination.page, pagination.pageSize)
  };
}

export async function getDetectionSummary() {
  const [totalIncidents, openIncidents, criticalCount, assetCount, confidenceAggregate] =
    await Promise.all([
      prisma.detection.count(),
      prisma.detection.count({
        where: {
          status: {
            in: [DetectionStatuses.OPEN, DetectionStatuses.INVESTIGATING]
          }
        }
      }),
      prisma.detection.count({
        where: {
          severity: "CRITICAL"
        }
      }),
      prisma.device.count(),
      prisma.detection.aggregate({
        _avg: {
          confidence: true
        }
      })
    ]);

  return {
    totalIncidents,
    openIncidents,
    criticalCount,
    averageConfidence: Number(confidenceAggregate._avg.confidence ?? 0),
    assetCount
  };
}

export async function createDetection(payload, createdById) {
  const device = await prisma.device.findUnique({
    where: {
      id: payload.deviceId
    },
    select: {
      id: true
    }
  });

  if (!device) {
    throw createHttpError(404, "Device not found.");
  }

  const detection = await prisma.detection.create({
    data: {
      deviceId: payload.deviceId,
      severity: payload.severity,
      status: payload.status ?? DetectionStatuses.OPEN,
      confidence: payload.confidence,
      authenticLat: payload.authenticLat,
      authenticLng: payload.authenticLng,
      spoofedLat: payload.spoofedLat ?? null,
      spoofedLng: payload.spoofedLng ?? null,
      driftMeters: payload.driftMeters ?? null,
      headingDelta: payload.headingDelta ?? null,
      description: payload.description,
      telemetry: payload.telemetry ?? null,
      createdById
    },
    select: baseDetectionSelect()
  });

  return serializeDetection(detection);
}

export async function updateDetectionStatus(detectionId, status) {
  const existingDetection = await prisma.detection.findUnique({
    where: {
      id: detectionId
    },
    select: {
      id: true
    }
  });

  if (!existingDetection) {
    throw createHttpError(404, "Detection not found.");
  }

  const detection = await prisma.detection.update({
    where: {
      id: detectionId
    },
    data: {
      status
    },
    select: baseDetectionSelect()
  });

  return serializeDetection(detection);
}

export async function getReportDetections(filters = {}) {
  const where = buildDetectionWhereClause(filters);

  const detections = await prisma.detection.findMany({
    where,
    take: Math.min(filters.limit ?? 100, 500),
    orderBy: {
      detectedAt: "desc"
    },
    select: baseDetectionSelect()
  });

  return detections.map(serializeDetection);
}

