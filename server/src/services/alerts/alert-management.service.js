import {
  ALERT_ACTIONS,
  ALERT_SEVERITIES,
  ALERT_STATUS
} from "../../constants/alert.js";
import { AlertModel } from "../../models/Alert.js";
import {
  emitAlertDeleted,
  emitAlertUpdated
} from "../../sockets/index.js";
import { ApiError } from "../../utils/ApiError.js";

const SEVERITY_ORDER = [
  ALERT_SEVERITIES.LOW,
  ALERT_SEVERITIES.MEDIUM,
  ALERT_SEVERITIES.HIGH,
  ALERT_SEVERITIES.CRITICAL
];

function sanitizeAlert(alert) {
  return typeof alert.toObject === "function" ? alert.toObject() : alert;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSearchQuery(search) {
  if (!search) {
    return {};
  }

  const pattern = new RegExp(escapeRegExp(search), "i");

  return {
    $or: [
      { title: pattern },
      { message: pattern },
      { deviceId: pattern },
      { deviceName: pattern }
    ]
  };
}

function buildActorAudit(actor) {
  return {
    actor: actor?.id ?? null,
    actorRole: actor?.role ?? null
  };
}

function appendAction(alert, action, note, actor) {
  alert.actionHistory.push({
    action,
    note: note || null,
    ...buildActorAudit(actor)
  });
}

function nextSeverity(currentSeverity) {
  const currentIndex = SEVERITY_ORDER.indexOf(currentSeverity);

  if (currentIndex === -1 || currentIndex === SEVERITY_ORDER.length - 1) {
    return currentSeverity;
  }

  return SEVERITY_ORDER[currentIndex + 1];
}

async function ensureAlertExists(alertId) {
  const alert = await AlertModel.findById(alertId)
    .populate("device", "deviceId deviceName status owner lastSeen")
    .populate("gpsLog")
    .populate("escalatedBy", "name email role")
    .populate("resolvedBy", "name email role")
    .populate("falsePositiveBy", "name email role")
    .populate("actionHistory.actor", "name email role");

  if (!alert) {
    throw ApiError.notFound("Alert not found");
  }

  return alert;
}

export async function listAlerts(query = {}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;

  const filters = {
    ...buildSearchQuery(query.search)
  };

  if (query.severity) {
    filters.severity = query.severity;
  }

  if (query.status) {
    filters.status = query.status;
  }

  if (query.escalated === "true") {
    filters.escalationCount = { $gt: 0 };
  }

  if (query.escalated === "false") {
    filters.escalationCount = 0;
  }

  const sortDirection = query.sortOrder === "asc" ? 1 : -1;
  const sort = {
    [query.sortBy ?? "triggeredAt"]: sortDirection
  };

  const [items, total] = await Promise.all([
    AlertModel.find(filters)
      .populate("device", "deviceId deviceName status owner lastSeen")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    AlertModel.countDocuments(filters)
  ]);

  return {
    data: items.map((alert) => sanitizeAlert(alert)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

export async function getAlertById(alertId) {
  const alert = await ensureAlertExists(alertId);
  return sanitizeAlert(alert);
}

export async function resolveAlert(alertId, payload, actor) {
  const alert = await ensureAlertExists(alertId);

  if (alert.status === ALERT_STATUS.FALSE_POSITIVE) {
    throw ApiError.badRequest("False positive alerts cannot be resolved");
  }

  alert.status = ALERT_STATUS.RESOLVED;
  alert.resolvedAt = new Date();
  alert.resolvedBy = actor?.id ?? null;
  alert.resolutionNote = payload.note || null;

  appendAction(alert, ALERT_ACTIONS.RESOLVED, payload.note, actor);

  await alert.save();
  await alert.populate("resolvedBy", "name email role");
  await alert.populate("actionHistory.actor", "name email role");

  const sanitizedAlert = sanitizeAlert(alert);
  emitAlertUpdated(sanitizedAlert);
  return sanitizedAlert;
}

export async function markAlertFalsePositive(alertId, payload, actor) {
  const alert = await ensureAlertExists(alertId);

  if (alert.status === ALERT_STATUS.RESOLVED) {
    throw ApiError.badRequest("Resolved alerts cannot be marked as false positive");
  }

  alert.status = ALERT_STATUS.FALSE_POSITIVE;
  alert.falsePositiveAt = new Date();
  alert.falsePositiveBy = actor?.id ?? null;
  alert.falsePositiveReason = payload.reason;

  appendAction(alert, ALERT_ACTIONS.FALSE_POSITIVE, payload.reason, actor);

  await alert.save();
  await alert.populate("falsePositiveBy", "name email role");
  await alert.populate("actionHistory.actor", "name email role");

  const sanitizedAlert = sanitizeAlert(alert);
  emitAlertUpdated(sanitizedAlert);
  return sanitizedAlert;
}

export async function escalateAlert(alertId, payload, actor) {
  const alert = await ensureAlertExists(alertId);

  if (alert.status === ALERT_STATUS.RESOLVED || alert.status === ALERT_STATUS.FALSE_POSITIVE) {
    throw ApiError.badRequest("Closed alerts cannot be escalated");
  }

  alert.severity = nextSeverity(alert.severity);
  alert.escalationCount += 1;
  alert.escalatedAt = new Date();
  alert.escalatedBy = actor?.id ?? null;

  appendAction(alert, ALERT_ACTIONS.ESCALATED, payload.note, actor);

  await alert.save();
  await alert.populate("escalatedBy", "name email role");
  await alert.populate("actionHistory.actor", "name email role");

  const sanitizedAlert = sanitizeAlert(alert);
  emitAlertUpdated(sanitizedAlert);
  return sanitizedAlert;
}

export async function deleteAlert(alertId) {
  const alert = await ensureAlertExists(alertId);

  await AlertModel.deleteOne({ _id: alert.id });
  emitAlertDeleted({
    id: alert.id
  });

  return {
    id: alert.id
  };
}
