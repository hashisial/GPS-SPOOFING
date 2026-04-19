export const REPORT_TYPES = ["DAILY", "WEEKLY", "MONTHLY", "DEVICE", "INCIDENT"];
export const REPORT_EXPORT_FORMATS = ["pdf", "csv", "excel"];
export const REPORT_SEVERITIES = ["Low", "Medium", "High", "Critical"];
export const REPORT_ALERT_STATUSES = ["OPEN", "ACKNOWLEDGED", "RESOLVED", "FALSE_POSITIVE"];

const REPORT_TYPE_LABELS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  DEVICE: "Device",
  INCIDENT: "Incident"
};

const SUMMARY_LABELS = {
  totalDevices: "Total Devices",
  activeDeviceCount: "Active Devices",
  totalGpsLogs: "GPS Logs",
  totalAlerts: "Total Alerts",
  criticalAlerts: "Critical Alerts",
  averageSpeed: "Average Speed",
  maxSpeed: "Max Speed",
  averageAccuracy: "Average Accuracy",
  totalIncidents: "Total Incidents",
  affectedDeviceCount: "Affected Devices",
  averageRiskScore: "Average Risk Score",
  maxRiskScore: "Max Risk Score",
  openAlerts: "Open Alerts"
};

const SUMMARY_METRIC_ORDER = [
  "totalDevices",
  "activeDeviceCount",
  "totalGpsLogs",
  "totalAlerts",
  "criticalAlerts",
  "totalIncidents",
  "affectedDeviceCount",
  "openAlerts",
  "averageRiskScore",
  "averageSpeed",
  "maxSpeed",
  "averageAccuracy",
  "maxRiskScore"
];

export function getReportTypeLabel(type) {
  return REPORT_TYPE_LABELS[type] ?? type ?? "Unknown";
}

export function formatReportDate(value) {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleString();
}

export function formatDateInputValue(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

export function formatReportPeriod(report) {
  if (!report?.periodStart && !report?.periodEnd) {
    return "Auto-calculated";
  }

  if (report?.periodStart && report?.periodEnd) {
    return `${formatDateInputValue(report.periodStart)} to ${formatDateInputValue(report.periodEnd)}`;
  }

  return formatDateInputValue(report.periodStart ?? report.periodEnd);
}

export function getReportSection(report, title) {
  return report?.data?.sections?.find((section) => section.title === title) ?? null;
}

export function getBreakdownItems(report, title) {
  const section = getReportSection(report, title);

  if (!section || !Array.isArray(section.rows)) {
    return [];
  }

  return section.rows
    .map((row) => ({
      label: String(row?.[0] ?? ""),
      value: Number(row?.[1] ?? 0)
    }))
    .filter((item) => item.label);
}

export function getSummaryMetrics(summary = {}) {
  return SUMMARY_METRIC_ORDER.filter((key) => summary[key] !== undefined && summary[key] !== null)
    .slice(0, 8)
    .map((key) => ({
      key,
      label: SUMMARY_LABELS[key] ?? key,
      value:
        typeof summary[key] === "number" && !Number.isInteger(summary[key])
          ? summary[key].toFixed(2)
          : String(summary[key])
    }));
}

export function createReportDownloadName(report, format) {
  const baseName = (report?.title || "gps-report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const extension = format === "excel" ? "xls" : format;
  return `${baseName || "gps-report"}.${extension}`;
}
