import prisma from "../config/db.js";
import { DeviceStatuses } from "../constants/roles.js";
import { createHttpError } from "../utils/http-error.js";
import { buildPaginationMeta, getPagination } from "../utils/pagination.js";

function serializeDevice(device) {
  return {
    id: device.id,
    callsign: device.callsign,
    label: device.label,
    fleet: device.fleet,
    status: device.status,
    latitude: device.lastKnownLat,
    longitude: device.lastKnownLng,
    notes: device.notes,
    detectionCount: device._count?.gpsLogs ?? 0,
    alertCount: device._count?.alerts ?? 0,
    lastSeenAt: device.lastSeenAt,
    createdAt: device.createdAt,
    updatedAt: device.updatedAt
  };
}

function buildDeviceWhereClause(search) {
  if (!search) {
    return {};
  }

  return {
    OR: [
      {
        callsign: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        label: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        fleet: {
          contains: search,
          mode: "insensitive"
        }
      }
    ]
  };
}

export async function listDevices({ page = 1, pageSize = 10, search } = {}) {
  const pagination = getPagination(page, pageSize);
  const where = buildDeviceWhereClause(search);

  const [total, devices] = await prisma.$transaction([
    prisma.device.count({ where }),
    prisma.device.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        _count: {
          select: {
            gpsLogs: true,
            alerts: true
          }
        }
      }
    })
  ]);

  return {
    data: devices.map(serializeDevice),
    pagination: buildPaginationMeta(total, pagination.page, pagination.pageSize)
  };
}

export async function createDevice(payload) {
  const existingDevice = await prisma.device.findUnique({
    where: {
      callsign: payload.callsign
    }
  });

  if (existingDevice) {
    throw createHttpError(409, "A device with this callsign already exists.");
  }

  const device = await prisma.device.create({
    data: {
      callsign: payload.callsign,
      label: payload.label,
      fleet: payload.fleet ?? null,
      status: payload.status ?? DeviceStatuses.ACTIVE,
      lastKnownLat: payload.latitude ?? null,
      lastKnownLng: payload.longitude ?? null,
      lastSeenAt:
        payload.latitude !== undefined && payload.longitude !== undefined ? new Date() : null,
      notes: payload.notes ?? null
    },
    include: {
      _count: {
        select: {
          gpsLogs: true,
          alerts: true
        }
      }
    }
  });

  return serializeDevice(device);
}

export async function updateDevice(deviceId, payload) {
  const existingDevice = await prisma.device.findUnique({
    where: {
      id: deviceId
    }
  });

  if (!existingDevice) {
    throw createHttpError(404, "Device not found.");
  }

  if (payload.callsign && payload.callsign !== existingDevice.callsign) {
    const duplicate = await prisma.device.findUnique({
      where: {
        callsign: payload.callsign
      }
    });

    if (duplicate) {
      throw createHttpError(409, "A device with this callsign already exists.");
    }
  }

  const device = await prisma.device.update({
    where: {
      id: deviceId
    },
    data: {
      ...(payload.callsign !== undefined ? { callsign: payload.callsign } : {}),
      ...(payload.label !== undefined ? { label: payload.label } : {}),
      ...(payload.fleet !== undefined ? { fleet: payload.fleet || null } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.latitude !== undefined ? { lastKnownLat: payload.latitude } : {}),
      ...(payload.longitude !== undefined ? { lastKnownLng: payload.longitude } : {}),
      ...(payload.latitude !== undefined || payload.longitude !== undefined
        ? { lastSeenAt: new Date() }
        : {}),
      ...(payload.notes !== undefined ? { notes: payload.notes || null } : {})
    },
    include: {
      _count: {
        select: {
          gpsLogs: true,
          alerts: true
        }
      }
    }
  });

  return serializeDevice(device);
}
