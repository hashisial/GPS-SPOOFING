import { ALERT_SEVERITIES, ALERT_STATUS } from "../../constants/alert.js";
import { REPORT_TYPES } from "../../constants/report.js";
import { AlertModel } from "../../models/Alert.js";
import { DeviceModel } from "../../models/Device.js";
import { GpsLogModel } from "../../models/GpsLog.js";
import { ReportModel } from "../../models/Report.js";
import { ApiError } from "../../utils/ApiError.js";
import { resolveReportPeriod, formatDateTime } from "../../utils/report-date.js";
import { buildReportExport } from "../../utils/report-export.js";

function sanitizeReport(report) {
  return typeof report.toObject === "function" ? report.toObject() : report;
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
      { deviceId: pattern },
      { type: pattern }
    ]
  };
}

function buildDateRangeFilter(field, periodStart, periodEnd) {
  if (!periodStart && !periodEnd) {
    return {};
  }

  return {
    [field]: {
      ...(periodStart ? { $gte: periodStart } : {}),
      ...(periodEnd ? { $lte: periodEnd } : {})
    }
  };
}

function toTableRowsFromCountMap(countMap, orderedKeys) {
  return orderedKeys.map((key) => [key, countMap[key] ?? 0]);
}

function createKeyValueSection(title, rows) {
  return {
    title,
    kind: "kv",
    rows
  };
}

function createTableSection(title, columns, rows) {
  return {
    title,
    kind: "table",
    columns,
    rows
  };
}

function defaultTitleForType(type, options = {}) {
  switch (type) {
    case REPORT_TYPES.DAILY:
      return `Daily Report - ${formatDateTime(options.periodStart).slice(0, 10)}`;
    case REPORT_TYPES.WEEKLY:
      return `Weekly Report - ${formatDateTime(options.periodStart).slice(0, 10)}`;
    case REPORT_TYPES.MONTHLY:
      return `Monthly Report - ${formatDateTime(options.periodStart).slice(0, 7)}`;
    case REPORT_TYPES.DEVICE:
      return `Device Report - ${options.device?.deviceName ?? options.deviceId}`;
    case REPORT_TYPES.INCIDENT:
      return `Incident Report - ${formatDateTime(options.periodStart).slice(0, 10)}`;
    default:
      return "Report";
  }
}

async function resolveDeviceByBusinessId(deviceId) {
  const normalizedDeviceId = deviceId?.trim().toUpperCase();
  const device = await DeviceModel.findOne({ deviceId: normalizedDeviceId }).populate(
    "owner",
    "name email role"
  );

  if (!device) {
    throw ApiError.notFound("Device not found");
  }

  return device;
}

async function buildCountMap(model, match, field, orderedValues) {
  const result = await model.aggregate([
    { $match: match },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } }
  ]);

  const map = Object.fromEntries(result.map((entry) => [entry._id, entry.count]));

  for (const value of orderedValues) {
    if (!(value in map)) {
      map[value] = 0;
    }
  }

  return map;
}

async function buildAlertBreakdowns(match) {
  const [severityBreakdown, statusBreakdown] = await Promise.all([
    buildCountMap(AlertModel, match, "severity", Object.values(ALERT_SEVERITIES)),
    buildCountMap(AlertModel, match, "status", Object.values(ALERT_STATUS))
  ]);

  return {
    severityBreakdown,
    statusBreakdown
  };
}

async function buildTopAffectedDevices(match, limit = 10) {
  return AlertModel.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          deviceId: "$deviceId",
          deviceName: "$deviceName"
        },
        alertCount: { $sum: 1 },
        criticalCount: {
          $sum: {
            $cond: [{ $eq: ["$severity", ALERT_SEVERITIES.CRITICAL] }, 1, 0]
          }
        }
      }
    },
    { $sort: { alertCount: -1, criticalCount: -1 } },
    { $limit: limit }
  ]);
}

async function buildRecentIncidents(match, limit = 25) {
  return AlertModel.find(match)
    .sort({ triggeredAt: -1 })
    .limit(limit)
    .select("triggeredAt deviceId deviceName severity status riskScore title");
}

async function buildGpsMetrics(match) {
  const [result] = await GpsLogModel.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalGpsLogs: { $sum: 1 },
        averageSpeed: { $avg: "$speed" },
        maxSpeed: { $max: "$speed" },
        averageAccuracy: { $avg: "$accuracy" },
        activeDevices: { $addToSet: "$deviceId" }
      }
    },
    {
      $project: {
        _id: 0,
        totalGpsLogs: 1,
        averageSpeed: 1,
        maxSpeed: 1,
        averageAccuracy: 1,
        activeDeviceCount: { $size: "$activeDevices" }
      }
    }
  ]);

  return (
    result ?? {
      totalGpsLogs: 0,
      averageSpeed: 0,
      maxSpeed: 0,
      averageAccuracy: 0,
      activeDeviceCount: 0
    }
  );
}

async function buildOperationalReport(type, payload, actor) {
  const { periodStart, periodEnd } = resolveReportPeriod(type, payload.periodStart, payload.periodEnd);
  const alertMatch = buildDateRangeFilter("triggeredAt", periodStart, periodEnd);
  const gpsMatch = buildDateRangeFilter("timestamp", periodStart, periodEnd);

  const [
    totalDevices,
    gpsMetrics,
    totalAlerts,
    alertBreakdowns,
    topAffectedDevices,
    recentIncidents
  ] = await Promise.all([
    DeviceModel.countDocuments({}),
    buildGpsMetrics(gpsMatch),
    AlertModel.countDocuments(alertMatch),
    buildAlertBreakdowns(alertMatch),
    buildTopAffectedDevices(alertMatch),
    buildRecentIncidents(alertMatch)
  ]);

  const summary = {
    totalDevices,
    activeDeviceCount: gpsMetrics.activeDeviceCount,
    totalGpsLogs: gpsMetrics.totalGpsLogs,
    totalAlerts,
    criticalAlerts: alertBreakdowns.severityBreakdown[ALERT_SEVERITIES.CRITICAL] ?? 0,
    averageSpeed: Number((gpsMetrics.averageSpeed ?? 0).toFixed(2)),
    maxSpeed: gpsMetrics.maxSpeed ?? 0,
    averageAccuracy: Number((gpsMetrics.averageAccuracy ?? 0).toFixed(2))
  };

  const sections = [
    createKeyValueSection("Overview", [
      { label: "Report Type", value: type },
      { label: "Period Start", value: formatDateTime(periodStart) },
      { label: "Period End", value: formatDateTime(periodEnd) },
      { label: "Total Devices", value: summary.totalDevices },
      { label: "Active Devices In Period", value: summary.activeDeviceCount },
      { label: "GPS Logs", value: summary.totalGpsLogs },
      { label: "Alerts", value: summary.totalAlerts },
      { label: "Critical Alerts", value: summary.criticalAlerts },
      { label: "Average Speed", value: summary.averageSpeed },
      { label: "Max Speed", value: summary.maxSpeed },
      { label: "Average Accuracy", value: summary.averageAccuracy }
    ]),
    createTableSection(
      "Severity Breakdown",
      ["Severity", "Count"],
      toTableRowsFromCountMap(alertBreakdowns.severityBreakdown, Object.values(ALERT_SEVERITIES))
    ),
    createTableSection(
      "Status Breakdown",
      ["Status", "Count"],
      toTableRowsFromCountMap(alertBreakdowns.statusBreakdown, Object.values(ALERT_STATUS))
    ),
    createTableSection(
      "Top Affected Devices",
      ["Device ID", "Device Name", "Alerts", "Critical Alerts"],
      topAffectedDevices.map((entry) => [
        entry._id.deviceId,
        entry._id.deviceName,
        entry.alertCount,
        entry.criticalCount
      ])
    ),
    createTableSection(
      "Recent Incidents",
      ["Triggered At", "Device ID", "Device Name", "Severity", "Status", "Risk Score", "Title"],
      recentIncidents.map((incident) => [
        formatDateTime(incident.triggeredAt),
        incident.deviceId,
        incident.deviceName,
        incident.severity,
        incident.status,
        incident.riskScore,
        incident.title
      ])
    )
  ];

  return ReportModel.create({
    type,
    title: payload.title?.trim() || defaultTitleForType(type, { periodStart }),
    periodStart,
    periodEnd,
    filters: {
      periodStart,
      periodEnd
    },
    summary,
    data: {
      sections
    },
    generatedBy: actor.id
  });
}

async function buildDeviceReport(payload, actor) {
  const device = await resolveDeviceByBusinessId(payload.deviceId);
  const { periodStart, periodEnd } = resolveReportPeriod(
    REPORT_TYPES.DEVICE,
    payload.periodStart,
    payload.periodEnd
  );
  const gpsMatch = {
    device: device._id,
    ...buildDateRangeFilter("timestamp", periodStart, periodEnd)
  };
  const alertMatch = {
    device: device._id,
    ...buildDateRangeFilter("triggeredAt", periodStart, periodEnd)
  };

  const [gpsMetrics, totalAlerts, alertBreakdowns, incidents] = await Promise.all([
    buildGpsMetrics(gpsMatch),
    AlertModel.countDocuments(alertMatch),
    buildAlertBreakdowns(alertMatch),
    buildRecentIncidents(alertMatch, 50)
  ]);

  const [firstLog, lastLog] = await Promise.all([
    GpsLogModel.findOne(gpsMatch).sort({ timestamp: 1 }).select("timestamp").lean(),
    GpsLogModel.findOne(gpsMatch).sort({ timestamp: -1 }).select("timestamp").lean()
  ]);

  const firstSeenInPeriod = firstLog?.timestamp ?? null;
  const lastSeenInPeriod = lastLog?.timestamp ?? null;

  const summary = {
    deviceId: device.deviceId,
    deviceName: device.deviceName,
    owner: device.owner?.name ?? "Unassigned",
    currentStatus: device.status,
    lastSeen: device.lastSeen,
    totalGpsLogs: gpsMetrics.totalGpsLogs,
    totalAlerts,
    criticalAlerts: alertBreakdowns.severityBreakdown[ALERT_SEVERITIES.CRITICAL] ?? 0,
    averageSpeed: Number((gpsMetrics.averageSpeed ?? 0).toFixed(2)),
    maxSpeed: gpsMetrics.maxSpeed ?? 0,
    averageAccuracy: Number((gpsMetrics.averageAccuracy ?? 0).toFixed(2))
  };

  const sections = [
    createKeyValueSection("Device Profile", [
      { label: "Device ID", value: device.deviceId },
      { label: "Device Name", value: device.deviceName },
      { label: "Type", value: device.type },
      { label: "Owner", value: device.owner?.name ?? "Unassigned" },
      { label: "Current Status", value: device.status },
      { label: "Last Seen", value: formatDateTime(device.lastSeen) },
      { label: "Period Start", value: formatDateTime(periodStart) },
      { label: "Period End", value: formatDateTime(periodEnd) }
    ]),
    createKeyValueSection("GPS Metrics", [
      { label: "GPS Logs", value: summary.totalGpsLogs },
      { label: "First Seen In Period", value: formatDateTime(firstSeenInPeriod) },
      { label: "Last Seen In Period", value: formatDateTime(lastSeenInPeriod) },
      { label: "Average Speed", value: summary.averageSpeed },
      { label: "Max Speed", value: summary.maxSpeed },
      { label: "Average Accuracy", value: summary.averageAccuracy }
    ]),
    createTableSection(
      "Severity Breakdown",
      ["Severity", "Count"],
      toTableRowsFromCountMap(alertBreakdowns.severityBreakdown, Object.values(ALERT_SEVERITIES))
    ),
    createTableSection(
      "Status Breakdown",
      ["Status", "Count"],
      toTableRowsFromCountMap(alertBreakdowns.statusBreakdown, Object.values(ALERT_STATUS))
    ),
    createTableSection(
      "Incidents",
      ["Triggered At", "Severity", "Status", "Risk Score", "Title"],
      incidents.map((incident) => [
        formatDateTime(incident.triggeredAt),
        incident.severity,
        incident.status,
        incident.riskScore,
        incident.title
      ])
    )
  ];

  return ReportModel.create({
    type: REPORT_TYPES.DEVICE,
    title:
      payload.title?.trim() ||
      defaultTitleForType(REPORT_TYPES.DEVICE, {
        device,
        deviceId: device.deviceId
      }),
    periodStart,
    periodEnd,
    device: device._id,
    deviceId: device.deviceId,
    filters: {
      periodStart,
      periodEnd,
      deviceId: device.deviceId
    },
    summary,
    data: {
      sections
    },
    generatedBy: actor.id
  });
}

async function buildIncidentReport(payload, actor) {
  const { periodStart, periodEnd } = resolveReportPeriod(
    REPORT_TYPES.INCIDENT,
    payload.periodStart,
    payload.periodEnd
  );
  const match = {
    ...buildDateRangeFilter("triggeredAt", periodStart, periodEnd)
  };

  let device = null;

  if (payload.deviceId) {
    device = await resolveDeviceByBusinessId(payload.deviceId);
    match.device = device._id;
  }

  if (payload.severity) {
    match.severity = payload.severity;
  }

  if (payload.status) {
    match.status = payload.status;
  }

  const [totalAlerts, alertBreakdowns, recentIncidents, topAffectedDevices, metrics] = await Promise.all([
    AlertModel.countDocuments(match),
    buildAlertBreakdowns(match),
    buildRecentIncidents(match, 100),
    buildTopAffectedDevices(match),
    AlertModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          averageRiskScore: { $avg: "$riskScore" },
          maxRiskScore: { $max: "$riskScore" },
          affectedDevices: { $addToSet: "$deviceId" }
        }
      },
      {
        $project: {
          _id: 0,
          averageRiskScore: 1,
          maxRiskScore: 1,
          affectedDeviceCount: { $size: "$affectedDevices" }
        }
      }
    ])
  ]);

  const aggregateMetrics = metrics[0] ?? {
    averageRiskScore: 0,
    maxRiskScore: 0,
    affectedDeviceCount: 0
  };

  const summary = {
    totalIncidents: totalAlerts,
    affectedDeviceCount: aggregateMetrics.affectedDeviceCount,
    averageRiskScore: Number((aggregateMetrics.averageRiskScore ?? 0).toFixed(2)),
    maxRiskScore: aggregateMetrics.maxRiskScore ?? 0,
    criticalAlerts: alertBreakdowns.severityBreakdown[ALERT_SEVERITIES.CRITICAL] ?? 0,
    openAlerts: alertBreakdowns.statusBreakdown[ALERT_STATUS.OPEN] ?? 0
  };

  const sections = [
    createKeyValueSection("Incident Overview", [
      { label: "Period Start", value: formatDateTime(periodStart) },
      { label: "Period End", value: formatDateTime(periodEnd) },
      { label: "Scoped Device", value: device?.deviceId ?? "All Devices" },
      { label: "Severity Filter", value: payload.severity ?? "All" },
      { label: "Status Filter", value: payload.status ?? "All" },
      { label: "Total Incidents", value: summary.totalIncidents },
      { label: "Affected Devices", value: summary.affectedDeviceCount },
      { label: "Average Risk Score", value: summary.averageRiskScore },
      { label: "Max Risk Score", value: summary.maxRiskScore }
    ]),
    createTableSection(
      "Severity Breakdown",
      ["Severity", "Count"],
      toTableRowsFromCountMap(alertBreakdowns.severityBreakdown, Object.values(ALERT_SEVERITIES))
    ),
    createTableSection(
      "Status Breakdown",
      ["Status", "Count"],
      toTableRowsFromCountMap(alertBreakdowns.statusBreakdown, Object.values(ALERT_STATUS))
    ),
    createTableSection(
      "Affected Devices",
      ["Device ID", "Device Name", "Alerts", "Critical Alerts"],
      topAffectedDevices.map((entry) => [
        entry._id.deviceId,
        entry._id.deviceName,
        entry.alertCount,
        entry.criticalCount
      ])
    ),
    createTableSection(
      "Incident List",
      ["Triggered At", "Device ID", "Device Name", "Severity", "Status", "Risk Score", "Title"],
      recentIncidents.map((incident) => [
        formatDateTime(incident.triggeredAt),
        incident.deviceId,
        incident.deviceName,
        incident.severity,
        incident.status,
        incident.riskScore,
        incident.title
      ])
    )
  ];

  return ReportModel.create({
    type: REPORT_TYPES.INCIDENT,
    title: payload.title?.trim() || defaultTitleForType(REPORT_TYPES.INCIDENT, { periodStart }),
    periodStart,
    periodEnd,
    device: device?._id ?? null,
    deviceId: device?.deviceId ?? null,
    filters: {
      periodStart,
      periodEnd,
      severity: payload.severity ?? null,
      status: payload.status ?? null,
      deviceId: device?.deviceId ?? null
    },
    summary,
    data: {
      sections
    },
    generatedBy: actor.id
  });
}

export async function generateReport(payload, actor) {
  switch (payload.type) {
    case REPORT_TYPES.DAILY:
    case REPORT_TYPES.WEEKLY:
    case REPORT_TYPES.MONTHLY:
      return sanitizeReport(await buildOperationalReport(payload.type, payload, actor));
    case REPORT_TYPES.DEVICE:
      return sanitizeReport(await buildDeviceReport(payload, actor));
    case REPORT_TYPES.INCIDENT:
      return sanitizeReport(await buildIncidentReport(payload, actor));
    default:
      throw ApiError.badRequest("Unsupported report type");
  }
}

export async function listReports(query = {}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;

  const filters = {
    ...buildSearchQuery(query.search)
  };

  if (query.type) {
    filters.type = query.type;
  }

  const sortDirection = query.sortOrder === "asc" ? 1 : -1;
  const sort = {
    [query.sortBy ?? "createdAt"]: sortDirection
  };

  const [items, total] = await Promise.all([
    ReportModel.find(filters)
      .populate("generatedBy", "name email role")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    ReportModel.countDocuments(filters)
  ]);

  return {
    data: items.map((report) => sanitizeReport(report)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

export async function getReportById(reportId) {
  const report = await ReportModel.findById(reportId)
    .populate("generatedBy", "name email role")
    .populate("device", "deviceId deviceName status owner lastSeen");

  if (!report) {
    throw ApiError.notFound("Report not found");
  }

  return sanitizeReport(report);
}

export async function exportReport(reportId, format) {
  const report = await ReportModel.findById(reportId);

  if (!report) {
    throw ApiError.notFound("Report not found");
  }

  report.lastExportedAt = new Date();
  await report.save();

  return buildReportExport(sanitizeReport(report), format);
}
