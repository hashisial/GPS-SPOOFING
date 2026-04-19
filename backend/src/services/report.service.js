import PDFDocument from "pdfkit";
import prisma from "../config/db.js";
import { ReportTypes } from "../constants/roles.js";
import { logger } from "../utils/logger.js";

function buildLogWhereClause(filters = {}) {
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

function buildAlertWhereClause(filters = {}) {
  const where = {};

  if (filters.deviceId) {
    where.deviceId = filters.deviceId;
  }

  if (filters.from || filters.to) {
    where.detectedAt = {};

    if (filters.from) {
      where.detectedAt.gte = filters.from;
    }

    if (filters.to) {
      where.detectedAt.lte = filters.to;
    }
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.severity) {
    where.severity = filters.severity;
  }

  return where;
}

function buildSeverityBreakdown(alerts) {
  return alerts.reduce(
    (accumulator, alert) => ({
      ...accumulator,
      [alert.severity]: (accumulator[alert.severity] ?? 0) + 1
    }),
    {}
  );
}

function buildTriggeredRuleBreakdown(alerts) {
  return alerts.reduce((accumulator, alert) => {
    alert.triggeredRules.forEach((rule) => {
      accumulator[rule] = (accumulator[rule] ?? 0) + 1;
    });

    return accumulator;
  }, {});
}

function buildReportSummary(logs, alerts) {
  return {
    generatedAt: new Date().toISOString(),
    totalLogs: logs.length,
    spoofedLogs: logs.filter((log) => log.isSpoofed).length,
    totalAlerts: alerts.length,
    severityBreakdown: buildSeverityBreakdown(alerts),
    triggeredRuleBreakdown: buildTriggeredRuleBreakdown(alerts),
    devicesObserved: new Set(logs.map((log) => log.deviceId)).size,
    latestAlert: alerts[0]
      ? {
          id: alerts[0].id,
          deviceId: alerts[0].deviceId,
          severity: alerts[0].severity,
          detectedAt: alerts[0].detectedAt
        }
      : null
  };
}

function csvEscape(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value).replace(/"/g, "\"\"");
  return /[",\n]/.test(stringValue) ? `"${stringValue}"` : stringValue;
}

function writeSummaryBlock(doc, summary) {
  doc.fontSize(12).fillColor("#0f172a").text(`Generated: ${summary.generatedAt}`);
  doc.text(`Total GPS logs: ${summary.totalLogs}`);
  doc.text(`Spoofed GPS logs: ${summary.spoofedLogs}`);
  doc.text(`Total alerts: ${summary.totalAlerts}`);
  doc.text(`Devices observed: ${summary.devicesObserved}`);
  doc.moveDown();
}

function writeAlertRows(doc, alerts) {
  doc.fontSize(15).fillColor("#111827").text("Alert Highlights");
  doc.moveDown(0.5);

  if (!alerts.length) {
    doc.fontSize(11).fillColor("#475569").text("No alerts matched the selected filters.");
    doc.moveDown();
    return;
  }

  alerts.slice(0, 12).forEach((alert, index) => {
    doc
      .fontSize(11)
      .fillColor("#0f172a")
      .text(
        `${index + 1}. ${alert.device?.callsign ?? "Asset"} | ${alert.severity} | ${Math.round(alert.confidence)}% confidence`
      );
    doc
      .fontSize(10)
      .fillColor("#475569")
      .text(
        `${alert.description} Detected at ${new Date(alert.detectedAt).toLocaleString("en-US")}.`
      );
    doc.moveDown(0.6);
  });
}

function serializeReport(report) {
  return {
    id: report.id,
    title: report.title,
    type: report.type,
    filters: report.filters,
    summary: report.summary,
    alertCount: report.alertCount,
    logCount: report.logCount,
    createdAt: report.createdAt
  };
}

export async function buildReportDataset(filters = {}) {
  const [logs, alerts] = await Promise.all([
    prisma.gpsLog.findMany({
      where: buildLogWhereClause(filters),
      include: {
        device: {
          select: {
            id: true,
            callsign: true,
            label: true
          }
        }
      },
      orderBy: {
        timestamp: "desc"
      }
    }),
    prisma.alert.findMany({
      where: buildAlertWhereClause(filters),
      include: {
        device: {
          select: {
            id: true,
            callsign: true,
            label: true
          }
        }
      },
      orderBy: {
        detectedAt: "desc"
      }
    })
  ]);

  return {
    logs,
    alerts,
    summary: buildReportSummary(logs, alerts)
  };
}

export async function createReport(payload, generatedById) {
  const filters = payload.filters ?? {};
  const dataset = await buildReportDataset(filters);
  const report = await prisma.report.create({
    data: {
      title:
        payload.title?.trim() ||
        `GPS spoofing report ${new Date().toISOString().slice(0, 10)}`,
      type: payload.type ?? ReportTypes.SPOOFING_ANALYSIS,
      generatedById,
      filters,
      summary: dataset.summary,
      alertCount: dataset.alerts.length,
      logCount: dataset.logs.length
    }
  });

  logger.info("report_created", {
    reportId: report.id,
    generatedById,
    alertCount: report.alertCount,
    logCount: report.logCount
  });

  return serializeReport(report);
}

export async function exportReportCsv(filters = {}) {
  const dataset = await buildReportDataset(filters);
  const rows = [
    ["GPS Spoofing Detection Report"],
    ["Generated At", dataset.summary.generatedAt],
    ["Total GPS Logs", dataset.summary.totalLogs],
    ["Spoofed GPS Logs", dataset.summary.spoofedLogs],
    ["Total Alerts", dataset.summary.totalAlerts],
    ["Devices Observed", dataset.summary.devicesObserved],
    [],
    [
      "Alert ID",
      "Device Callsign",
      "Device Label",
      "Severity",
      "Status",
      "Confidence",
      "Rules",
      "Detected At",
      "Latitude",
      "Longitude"
    ],
    ...dataset.alerts.map((alert) => [
      alert.id,
      alert.device?.callsign ?? "",
      alert.device?.label ?? "",
      alert.severity,
      alert.status,
      alert.confidence,
      alert.triggeredRules.join(" | "),
      alert.detectedAt.toISOString(),
      alert.gpsLog?.latitude ?? "",
      alert.gpsLog?.longitude ?? ""
    ]),
    [],
    [
      "GPS Log ID",
      "Device Callsign",
      "Timestamp",
      "Latitude",
      "Longitude",
      "Speed KPH",
      "Signal",
      "Accuracy Meters",
      "Spoofed",
      "Score"
    ],
    ...dataset.logs.map((log) => [
      log.id,
      log.device?.callsign ?? "",
      log.timestamp.toISOString(),
      log.latitude,
      log.longitude,
      log.speedKph ?? "",
      log.signalStrength ?? "",
      log.accuracyMeters ?? "",
      log.isSpoofed ? "YES" : "NO",
      log.spoofingScore
    ])
  ];

  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

export async function createReportPdf(filters = {}) {
  const dataset = await buildReportDataset(filters);
  const doc = new PDFDocument({
    margin: 48,
    size: "A4"
  });

  doc.fontSize(22).fillColor("#0f172a").text("GPS Spoofing Detection Report");
  doc.moveDown(0.4);
  writeSummaryBlock(doc, dataset.summary);
  writeAlertRows(doc, dataset.alerts);

  doc.fontSize(15).fillColor("#111827").text("Recent GPS Logs");
  doc.moveDown(0.5);

  if (!dataset.logs.length) {
    doc.fontSize(11).fillColor("#475569").text("No GPS logs matched the selected filters.");
  } else {
    dataset.logs.slice(0, 12).forEach((log, index) => {
      doc
        .fontSize(11)
        .fillColor("#0f172a")
        .text(
          `${index + 1}. ${log.device?.callsign ?? "Asset"} | ${new Date(log.timestamp).toLocaleString("en-US")}`
        );
      doc
        .fontSize(10)
        .fillColor("#475569")
        .text(
          `Lat/Lng ${log.latitude.toFixed(4)}, ${log.longitude.toFixed(4)} | Speed ${Math.round(log.speedKph ?? 0)} kph | Signal ${Math.round(log.signalStrength ?? 0)} | Score ${Math.round(log.spoofingScore)}`
        );
      doc.moveDown(0.5);
    });
  }

  return doc;
}
