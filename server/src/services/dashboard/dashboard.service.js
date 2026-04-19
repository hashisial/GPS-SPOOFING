import { env } from "../../config/env.js";
import { ALERT_SEVERITIES, ALERT_STATUS } from "../../constants/alert.js";
import { DEVICE_STATUS } from "../../constants/device.js";
import { DeviceModel } from "../../models/Device.js";
import { AlertModel } from "../../models/Alert.js";
import { GpsLogModel } from "../../models/GpsLog.js";

const SEVERITY_WEIGHTS = {
  [ALERT_SEVERITIES.LOW]: 25,
  [ALERT_SEVERITIES.MEDIUM]: 50,
  [ALERT_SEVERITIES.HIGH]: 75,
  [ALERT_SEVERITIES.CRITICAL]: 100
};

const RISK_COLORS = {
  [ALERT_SEVERITIES.LOW]: "#22c55e",
  [ALERT_SEVERITIES.MEDIUM]: "#f59e0b",
  [ALERT_SEVERITIES.HIGH]: "#fb7185",
  [ALERT_SEVERITIES.CRITICAL]: "#ef4444"
};

function startOfDay(date = new Date()) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function addDays(date, amount) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function buildDayWindows(days) {
  const today = startOfDay();

  return Array.from({ length: days }, (_value, index) => {
    const start = addDays(today, index - (days - 1));
    const end = addDays(start, 1);

    return {
      start,
      end,
      label: start.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
      })
    };
  });
}

function buildThreeHourWindows() {
  const today = startOfDay();

  return Array.from({ length: 8 }, (_value, index) => {
    const start = new Date(today);
    start.setHours(index * 3, 0, 0, 0);

    const end = new Date(start);
    end.setHours(start.getHours() + 3);

    return {
      start,
      end,
      label: `${String(start.getHours()).padStart(2, "0")}:00`
    };
  });
}

function buildPercentageChange(currentValue, previousValue) {
  if (currentValue === 0 && previousValue === 0) {
    return "0%";
  }

  if (previousValue === 0) {
    return `+${currentValue * 100}%`;
  }

  const delta = ((currentValue - previousValue) / previousValue) * 100;
  const rounded = Math.round(delta);

  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}

function formatRelativeTime(value) {
  if (!value) {
    return "N/A";
  }

  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} d ago`;
}

async function countAlertsInWindow(start, end, extraMatch = {}) {
  return AlertModel.countDocuments({
    triggeredAt: {
      $gte: start,
      $lt: end
    },
    ...extraMatch
  });
}

async function buildDailyCountSeries(days, extraMatch = {}) {
  const windows = buildDayWindows(days);
  const counts = await Promise.all(
    windows.map((window) => countAlertsInWindow(window.start, window.end, extraMatch))
  );

  return windows.map((window, index) => ({
    label: window.label,
    value: counts[index]
  }));
}

async function buildCumulativeDeviceSeries(days) {
  const windows = buildDayWindows(days);
  const baseCount = await DeviceModel.countDocuments({
    createdAt: {
      $lt: windows[0].start
    }
  });

  const counts = await Promise.all(
    windows.map((window) =>
      DeviceModel.countDocuments({
        createdAt: {
          $gte: window.start,
          $lt: window.end
        }
      })
    )
  );

  let runningTotal = baseCount;

  return windows.map((window, index) => {
    runningTotal += counts[index];

    return {
      label: window.label,
      value: runningTotal
    };
  });
}

async function buildDailyActiveDeviceSeries(days) {
  const windows = buildDayWindows(days);

  const counts = await Promise.all(
    windows.map(async (window) => {
      const deviceIds = await GpsLogModel.distinct("deviceId", {
        timestamp: {
          $gte: window.start,
          $lt: window.end
        }
      });

      return deviceIds.length;
    })
  );

  return windows.map((window, index) => ({
    label: window.label,
    value: counts[index]
  }));
}

async function buildSeverityDistribution() {
  const results = await AlertModel.aggregate([
    {
      $group: {
        _id: "$severity",
        count: {
          $sum: 1
        }
      }
    }
  ]);

  const total = results.reduce((sum, item) => sum + item.count, 0);
  const countMap = Object.fromEntries(results.map((item) => [item._id, item.count]));

  return Object.values(ALERT_SEVERITIES).map((severity) => ({
    label: severity,
    value:
      total > 0
        ? Math.round(((countMap[severity] ?? 0) / total) * 100)
        : severity === ALERT_SEVERITIES.LOW
          ? 100
          : 0,
    color: RISK_COLORS[severity]
  }));
}

async function buildThreatTrend() {
  const windows = buildThreeHourWindows();
  const alerts = await AlertModel.find({
    triggeredAt: {
      $gte: windows[0].start,
      $lt: windows[windows.length - 1].end
    }
  }).select("triggeredAt severity");

  return windows.map((window) => {
    const value = alerts.reduce((sum, alert) => {
      const triggeredAt = new Date(alert.triggeredAt).getTime();

      if (
        triggeredAt >= window.start.getTime() &&
        triggeredAt < window.end.getTime()
      ) {
        return sum + (SEVERITY_WEIGHTS[alert.severity] ?? 0) / 25;
      }

      return sum;
    }, 0);

    return {
      label: window.label,
      value
    };
  });
}

function buildMetricCard(title, value, change, tone, trend) {
  return {
    title,
    value: String(value),
    change,
    tone,
    trend: trend.map((point) => point.value)
  };
}

function calculateRiskScore(distribution) {
  const weightedValue = distribution.reduce(
    (sum, item) => sum + item.value * ((SEVERITY_WEIGHTS[item.label] ?? 0) / 100),
    0
  );

  return Math.round(weightedValue);
}

async function buildLatestAlerts() {
  const alerts = await AlertModel.find({})
    .sort({ triggeredAt: -1 })
    .limit(5)
    .select("title deviceId severity triggeredAt message");

  return alerts.map((alert) => ({
    id: alert.id,
    title: alert.title,
    device: alert.deviceId,
    severity: alert.severity,
    time: formatRelativeTime(alert.triggeredAt),
    summary: alert.message
  }));
}

function buildSystemHealth({
  totalDevices,
  onlineDevices,
  openAlerts,
  criticalAlerts,
  gpsLogsLastHour
}) {
  const fleetAvailability = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 100;
  const telemetryScore = Math.min(100, Math.max(55, fleetAvailability));
  const detectionScore = Math.max(60, 96 - Math.min(openAlerts * 2, 26));
  const pipelineScore = Math.max(52, 94 - Math.min(criticalAlerts * 6, 42));
  const databaseScore = gpsLogsLastHour > 0 ? 95 : 82;

  return [
    {
      label: "Telemetry API",
      value: telemetryScore >= 85 ? "Healthy" : "Monitoring",
      score: telemetryScore,
      detail: "Live GPS ingest availability derived from current active fleet activity.",
      tone: telemetryScore >= 85 ? "success" : "info"
    },
    {
      label: "Detection Engine",
      value: detectionScore >= 80 ? "Stable" : "Elevated",
      score: detectionScore,
      detail: "Rule engine pressure reflects the current open alert backlog and critical density.",
      tone: detectionScore >= 80 ? "success" : "warning"
    },
    {
      label: "Alert Pipeline",
      value: criticalAlerts > 0 ? "Elevated" : "Nominal",
      score: pipelineScore,
      detail: "Queue health is weighted by the current critical incident count awaiting analyst attention.",
      tone: criticalAlerts > 0 ? "warning" : "info"
    },
    {
      label: "Database",
      value: databaseScore >= 90 ? "Stable" : "Monitoring",
      score: databaseScore,
      detail: "Operational database posture inferred from recent telemetry write activity.",
      tone: databaseScore >= 90 ? "success" : "info"
    }
  ];
}

function buildChecklist({ criticalAlerts, alertsToday, onlineDevices }) {
  const checklist = [
    "Review the latest spoofing incidents before closing the current shift."
  ];

  if (criticalAlerts > 0) {
    checklist.unshift(`Escalate ${criticalAlerts} critical alert${criticalAlerts > 1 ? "s" : ""} immediately.`);
  }

  if (alertsToday >= 10) {
    checklist.push("Export an incident report for the current operational window.");
  }

  if (onlineDevices > 0) {
    checklist.push("Validate active devices reporting inside secure movement corridors.");
  }

  return checklist.slice(0, 3);
}

export async function getDashboardOverview() {
  const todayStart = startOfDay();
  const tomorrow = addDays(todayStart, 1);
  const yesterdayStart = addDays(todayStart, -1);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const onlineCutoff = new Date(Date.now() - env.deviceOnlineWindowMs);

  const [
    totalDevices,
    onlineDevices,
    alertsToday,
    criticalAlerts,
    openAlerts,
    yesterdayAlerts,
    riskDistribution,
    latestAlerts,
    deviceTrend,
    onlineTrend,
    alertsTrend,
    criticalTrend,
    threatTrend,
    gpsLogsLastHour
  ] = await Promise.all([
    DeviceModel.countDocuments({}),
    DeviceModel.countDocuments({
      status: {
        $ne: DEVICE_STATUS.DISABLED
      },
      lastSeen: {
        $gte: onlineCutoff
      }
    }),
    countAlertsInWindow(todayStart, tomorrow),
    countAlertsInWindow(todayStart, tomorrow, { severity: ALERT_SEVERITIES.CRITICAL }),
    AlertModel.countDocuments({ status: ALERT_STATUS.OPEN }),
    countAlertsInWindow(yesterdayStart, todayStart),
    buildSeverityDistribution(),
    buildLatestAlerts(),
    buildCumulativeDeviceSeries(10),
    buildDailyActiveDeviceSeries(10),
    buildDailyCountSeries(10),
    buildDailyCountSeries(10, { severity: ALERT_SEVERITIES.CRITICAL }),
    buildThreatTrend(),
    GpsLogModel.countDocuments({
      timestamp: {
        $gte: oneHourAgo
      }
    })
  ]);

  const overallRiskScore = calculateRiskScore(riskDistribution);

  return {
    summary: {
      totalDevices,
      onlineDevices,
      alertsToday,
      criticalAlerts,
      overallRiskScore,
      riskDelta: buildPercentageChange(alertsToday, yesterdayAlerts)
    },
    metrics: [
      buildMetricCard(
        "Total Devices",
        totalDevices,
        `${deviceTrend[deviceTrend.length - 1]?.value - deviceTrend[0]?.value || 0} added in 10 days`,
        "info",
        deviceTrend
      ),
      buildMetricCard(
        "Online Devices",
        onlineDevices,
        totalDevices > 0
          ? `${Math.round((onlineDevices / totalDevices) * 100)}% fleet availability`
          : "No devices enrolled",
        "success",
        onlineTrend
      ),
      buildMetricCard(
        "Alerts Today",
        alertsToday,
        `${buildPercentageChange(alertsToday, yesterdayAlerts)} vs yesterday`,
        "warning",
        alertsTrend
      ),
      buildMetricCard(
        "Critical Alerts",
        criticalAlerts,
        criticalAlerts > 0 ? "Immediate analyst review required" : "No critical incidents in scope",
        criticalAlerts > 0 ? "danger" : "success",
        criticalTrend
      )
    ],
    riskDistribution,
    threatTrend,
    latestAlerts,
    systemHealth: buildSystemHealth({
      totalDevices,
      onlineDevices,
      openAlerts,
      criticalAlerts,
      gpsLogsLastHour
    }),
    responseChecklist: buildChecklist({
      criticalAlerts,
      alertsToday,
      onlineDevices
    })
  };
}
