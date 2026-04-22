export const dashboardSummary = {
  totalDevices: 128,
  onlineDevices: 104,
  alertsToday: 19,
  criticalAlerts: 4,
  overallRiskScore: 72,
  riskDelta: "+8%"
};

export const dashboardMetrics = [
  {
    title: "Total Devices",
    value: "128",
    change: "+12 this week",
    tone: "info",
    trend: [44, 48, 52, 57, 63, 71, 76, 83, 88, 92]
  },
  {
    title: "Online Devices",
    value: "104",
    change: "81.2% fleet availability",
    tone: "success",
    trend: [76, 79, 82, 84, 86, 88, 87, 89, 91, 94]
  },
  {
    title: "Alerts Today",
    value: "19",
    change: "+5 since 06:00 UTC",
    tone: "warning",
    trend: [6, 7, 9, 10, 10, 12, 13, 15, 17, 19]
  },
  {
    title: "Critical Alerts",
    value: "4",
    change: "2 require immediate triage",
    tone: "danger",
    trend: [1, 1, 2, 2, 3, 3, 3, 4, 4, 4]
  }
];

export const riskDistribution = [
  { label: "Low", value: 22, color: "#1BC2D5" },
  { label: "Medium", value: 31, color: "#145052" },
  { label: "High", value: 29, color: "#1BC2D5" },
  { label: "Critical", value: 18, color: "#FFFFFF" }
];

export const threatTrend = [
  { label: "00:00", value: 18 },
  { label: "03:00", value: 26 },
  { label: "06:00", value: 22 },
  { label: "09:00", value: 38 },
  { label: "12:00", value: 47 },
  { label: "15:00", value: 42 },
  { label: "18:00", value: 54 },
  { label: "21:00", value: 49 }
];

export const latestAlerts = [
  {
    id: "ALT-2401",
    title: "Teleport movement detected",
    device: "TRK-8842",
    severity: "Critical",
    time: "2 min ago",
    summary: "Device crossed 5.6 km in under 40 seconds near Karachi perimeter."
  },
  {
    id: "ALT-2398",
    title: "Geofence violation",
    device: "VEH-2170",
    severity: "High",
    time: "9 min ago",
    summary: "Fleet vehicle exited secure corridor and continued reporting unstable coordinates."
  },
  {
    id: "ALT-2393",
    title: "Repeated coordinates",
    device: "MOB-1941",
    severity: "Medium",
    time: "17 min ago",
    summary: "Coordinate lock persisted across multiple moving samples with changing headings."
  },
  {
    id: "ALT-2387",
    title: "Accuracy fluctuation",
    device: "TRK-7188",
    severity: "Low",
    time: "29 min ago",
    summary: "Accuracy shifted from 4m to 61m with no corresponding speed reduction."
  }
];

export const systemHealth = [
  {
    label: "Telemetry API",
    value: "Healthy",
    score: 98,
    detail: "Stable ingest throughput with no rate-limit saturation.",
    tone: "success"
  },
  {
    label: "Detection Engine",
    value: "Monitoring",
    score: 91,
    detail: "Risk engine active. Queue depth nominal across all rulesets.",
    tone: "info"
  },
  {
    label: "Alert Pipeline",
    value: "Elevated",
    score: 76,
    detail: "Critical queue expanded after afternoon spoofing burst.",
    tone: "warning"
  },
  {
    label: "Database",
    value: "Stable",
    score: 94,
    detail: "Write latency within acceptable operational threshold.",
    tone: "success"
  }
];

export const responseChecklist = [
  "Escalate critical spoofing events within 5 minutes.",
  "Verify devices with repeated coordinate locks against operator movement logs.",
  "Export an incident report for the current shift once alert count exceeds 15."
];
