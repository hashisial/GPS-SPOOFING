import {
  dashboardMetrics,
  latestAlerts as dashboardLatestAlerts,
  responseChecklist,
  riskDistribution,
  systemHealth,
  threatTrend
} from "../../components/dashboard/dashboard-data.js";
import { APP_ROLES } from "../../utils/constants/app.constants.js";
import { readStoredSession } from "../../utils/helpers/auth-storage.js";

const DEMO_STORAGE_KEY = "gps-dashboard.preview.store";
const DEMO_TOKEN_PREFIX = "demo-access-";

const DEFAULT_NOTIFICATION_SETTINGS = {
  emailAlerts: true,
  inAppAlerts: true,
  soundAlerts: true,
  digestFrequency: "DAILY"
};

const DEFAULT_THRESHOLD_SETTINGS = {
  jumpDistanceKm: 1.5,
  unrealisticSpeedKph: 280,
  signalAnomalyScore: 40,
  accuracyThresholdM: 50
};

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function createInitialStore() {
  const users = [
    {
      id: "user-demo-admin",
      name: "Command Admin",
      email: "admin@gpsshield.local",
      password: "Admin123!",
      role: APP_ROLES.SUPER_ADMIN,
      isActive: true,
      createdAt: daysAgo(18),
      updatedAt: daysAgo(1),
      lastLoginAt: minutesAgo(14),
      preferences: {
        theme: "dark",
        notifications: {
          ...DEFAULT_NOTIFICATION_SETTINGS
        }
      }
    },
    {
      id: "user-demo-analyst",
      name: "Security Analyst",
      email: "analyst@gpsshield.local",
      password: "Analyst123!",
      role: APP_ROLES.SECURITY_ANALYST,
      isActive: true,
      createdAt: daysAgo(12),
      updatedAt: daysAgo(2),
      lastLoginAt: hoursAgo(2),
      preferences: {
        theme: "dark",
        notifications: {
          ...DEFAULT_NOTIFICATION_SETTINGS,
          emailAlerts: false
        }
      }
    },
    {
      id: "user-demo-viewer",
      name: "Operations Viewer",
      email: "viewer@gpsshield.local",
      password: "Viewer123!",
      role: APP_ROLES.VIEWER,
      isActive: true,
      createdAt: daysAgo(8),
      updatedAt: daysAgo(1),
      lastLoginAt: daysAgo(1),
      preferences: {
        theme: "dark",
        notifications: {
          ...DEFAULT_NOTIFICATION_SETTINGS,
          soundAlerts: false
        }
      }
    }
  ];

  const devices = [
    {
      id: "device-demo-ax01",
      deviceId: "TRK-8842",
      deviceName: "Tracker AX-01",
      type: "TRACKER",
      ownerId: "user-demo-admin",
      status: "ONLINE",
      lastSeen: minutesAgo(2),
      notes: "Primary perimeter tracker covering eastern corridor.",
      createdAt: daysAgo(30),
      updatedAt: minutesAgo(5),
      trail: [
        { latitude: 24.8562, longitude: 67.0082, speed: 42, accuracy: 7, heading: 34, timestamp: minutesAgo(22) },
        { latitude: 24.8589, longitude: 67.0118, speed: 45, accuracy: 8, heading: 36, timestamp: minutesAgo(16) },
        { latitude: 24.8607, longitude: 67.0136, speed: 41, accuracy: 6, heading: 38, timestamp: minutesAgo(10) },
        { latitude: 24.8622, longitude: 67.0161, speed: 43, accuracy: 7, heading: 37, timestamp: minutesAgo(2) }
      ]
    },
    {
      id: "device-demo-vh02",
      deviceId: "VEH-2170",
      deviceName: "Vehicle Unit 2170",
      type: "VEHICLE",
      ownerId: "user-demo-analyst",
      status: "ONLINE",
      lastSeen: minutesAgo(4),
      notes: "Mobile patrol vehicle with intermittent spoofing history.",
      createdAt: daysAgo(42),
      updatedAt: minutesAgo(6),
      trail: [
        { latitude: 24.8444, longitude: 67.0282, speed: 28, accuracy: 9, heading: 61, timestamp: minutesAgo(24) },
        { latitude: 24.8468, longitude: 67.0309, speed: 31, accuracy: 10, heading: 67, timestamp: minutesAgo(18) },
        { latitude: 24.8504, longitude: 67.0368, speed: 33, accuracy: 11, heading: 74, timestamp: minutesAgo(11) },
        { latitude: 24.8537, longitude: 67.0402, speed: 29, accuracy: 9, heading: 79, timestamp: minutesAgo(4) }
      ]
    },
    {
      id: "device-demo-dr03",
      deviceId: "DRN-4401",
      deviceName: "Recon Drone 4401",
      type: "DRONE",
      ownerId: "user-demo-analyst",
      status: "MAINTENANCE",
      lastSeen: hoursAgo(3),
      notes: "Temporarily grounded after critical teleport alert.",
      createdAt: daysAgo(20),
      updatedAt: hoursAgo(3),
      trail: [
        { latitude: 24.8701, longitude: 67.0528, speed: 58, accuracy: 12, heading: 120, timestamp: hoursAgo(4) },
        { latitude: 24.8752, longitude: 67.0617, speed: 64, accuracy: 13, heading: 128, timestamp: hoursAgo(3.7) },
        { latitude: 24.9418, longitude: 67.1541, speed: 298, accuracy: 180, heading: 142, timestamp: hoursAgo(3.4) },
        { latitude: 24.9191, longitude: 67.1215, speed: 42, accuracy: 52, heading: 149, timestamp: hoursAgo(3) }
      ]
    },
    {
      id: "device-demo-mb04",
      deviceId: "MOB-1941",
      deviceName: "Mobile Unit 1941",
      type: "MOBILE",
      ownerId: null,
      status: "OFFLINE",
      lastSeen: hoursAgo(8),
      notes: "Field handset currently out of reporting window.",
      createdAt: daysAgo(10),
      updatedAt: hoursAgo(8),
      trail: [
        { latitude: 24.8352, longitude: 66.9921, speed: 12, accuracy: 15, heading: 18, timestamp: hoursAgo(8.7) },
        { latitude: 24.8367, longitude: 66.9954, speed: 14, accuracy: 15, heading: 22, timestamp: hoursAgo(8.4) },
        { latitude: 24.8382, longitude: 66.9988, speed: 13, accuracy: 16, heading: 23, timestamp: hoursAgo(8) }
      ]
    }
  ];

  const alerts = [
    {
      id: "alert-demo-2401",
      title: "Teleport movement detected",
      message: "Device reported a long-distance displacement within an implausibly short interval.",
      severity: "Critical",
      status: "OPEN",
      riskScore: 97,
      deviceId: "DRN-4401",
      deviceName: "Recon Drone 4401",
      coordinates: {
        latitude: 24.9418,
        longitude: 67.1541
      },
      triggeredAt: hoursAgo(3.4),
      findings: [
        {
          rule: "TELEPORT_MOVEMENT",
          riskScore: 95,
          summary: "Device traversed over 11 km within less than 20 minutes."
        },
        {
          rule: "UNREALISTIC_SPEED",
          riskScore: 92,
          summary: "Observed velocity exceeded the configured drone threshold."
        }
      ],
      actionHistory: [
        {
          action: "CREATED",
          timestamp: hoursAgo(3.4),
          note: "Alert generated by preview detection engine.",
          actorRole: "SYSTEM"
        }
      ],
      createdAt: hoursAgo(3.4),
      updatedAt: hoursAgo(3.4)
    },
    {
      id: "alert-demo-2398",
      title: "Geofence violation",
      message: "Patrol vehicle moved outside the monitored security corridor while reporting unstable telemetry.",
      severity: "High",
      status: "ACKNOWLEDGED",
      riskScore: 82,
      deviceId: "VEH-2170",
      deviceName: "Vehicle Unit 2170",
      coordinates: {
        latitude: 24.8537,
        longitude: 67.0402
      },
      triggeredAt: minutesAgo(47),
      findings: [
        {
          rule: "GEOFENCE_VIOLATION",
          riskScore: 81,
          summary: "Route exceeded the defined patrol corridor boundary."
        },
        {
          rule: "ACCURACY_FLUCTUATION",
          riskScore: 53,
          summary: "Accuracy degraded during corridor exit."
        }
      ],
      actionHistory: [
        {
          action: "CREATED",
          timestamp: minutesAgo(47),
          note: "Alert generated by preview detection engine.",
          actorRole: "SYSTEM"
        },
        {
          action: "ACKNOWLEDGED",
          timestamp: minutesAgo(35),
          note: "Analyst accepted incident for review.",
          actor: {
            name: "Security Analyst",
            role: APP_ROLES.SECURITY_ANALYST
          }
        }
      ],
      createdAt: minutesAgo(47),
      updatedAt: minutesAgo(35)
    },
    {
      id: "alert-demo-2393",
      title: "Repeated coordinates",
      message: "Mobile endpoint repeated nearly identical positions while speed and heading changed.",
      severity: "Medium",
      status: "OPEN",
      riskScore: 61,
      deviceId: "MOB-1941",
      deviceName: "Mobile Unit 1941",
      coordinates: {
        latitude: 24.8382,
        longitude: 66.9988
      },
      triggeredAt: hoursAgo(7.8),
      findings: [
        {
          rule: "REPEATED_COORDINATES",
          riskScore: 61,
          summary: "Coordinates remained static across multiple moving samples."
        }
      ],
      actionHistory: [
        {
          action: "CREATED",
          timestamp: hoursAgo(7.8),
          note: "Alert generated by preview detection engine.",
          actorRole: "SYSTEM"
        }
      ],
      createdAt: hoursAgo(7.8),
      updatedAt: hoursAgo(7.8)
    },
    {
      id: "alert-demo-2387",
      title: "Accuracy fluctuation",
      message: "Tracker accuracy shifted outside the stable telemetry band without a matching environment change.",
      severity: "Low",
      status: "RESOLVED",
      riskScore: 38,
      deviceId: "TRK-8842",
      deviceName: "Tracker AX-01",
      coordinates: {
        latitude: 24.8607,
        longitude: 67.0136
      },
      triggeredAt: hoursAgo(13),
      findings: [
        {
          rule: "ACCURACY_FLUCTUATION",
          riskScore: 38,
          summary: "Accuracy briefly degraded and then normalized."
        }
      ],
      actionHistory: [
        {
          action: "CREATED",
          timestamp: hoursAgo(13),
          note: "Alert generated by preview detection engine.",
          actorRole: "SYSTEM"
        },
        {
          action: "RESOLVED",
          timestamp: hoursAgo(12.2),
          note: "Issue traced to temporary urban canyon multipath effects.",
          actor: {
            name: "Command Admin",
            role: APP_ROLES.SUPER_ADMIN
          }
        }
      ],
      createdAt: hoursAgo(13),
      updatedAt: hoursAgo(12.2)
    }
  ];

  const reports = [
    {
      id: "report-demo-daily",
      title: "Daily Security Summary",
      type: "DAILY",
      periodStart: daysAgo(1),
      periodEnd: new Date().toISOString(),
      createdAt: minutesAgo(55),
      summary: {
        totalDevices: devices.length,
        activeDeviceCount: devices.filter((device) => device.status !== "DISABLED").length,
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter((alert) => alert.severity === "Critical").length,
        openAlerts: alerts.filter((alert) => alert.status === "OPEN").length,
        averageRiskScore: 69
      },
      data: {
        sections: [
          {
            title: "Severity Breakdown",
            rows: [
              ["Low", 1],
              ["Medium", 1],
              ["High", 1],
              ["Critical", 1]
            ]
          },
          {
            title: "Status Breakdown",
            rows: [
              ["OPEN", 2],
              ["ACKNOWLEDGED", 1],
              ["RESOLVED", 1],
              ["FALSE_POSITIVE", 0]
            ]
          }
        ]
      }
    },
    {
      id: "report-demo-incident",
      title: "Incident Escalation Review",
      type: "INCIDENT",
      periodStart: daysAgo(3),
      periodEnd: new Date().toISOString(),
      createdAt: hoursAgo(6),
      summary: {
        totalIncidents: alerts.length,
        affectedDeviceCount: 4,
        criticalAlerts: 1,
        averageRiskScore: 69,
        maxRiskScore: 97
      },
      data: {
        sections: [
          {
            title: "Severity Breakdown",
            rows: [
              ["Low", 1],
              ["Medium", 1],
              ["High", 1],
              ["Critical", 1]
            ]
          },
          {
            title: "Status Breakdown",
            rows: [
              ["OPEN", 2],
              ["ACKNOWLEDGED", 1],
              ["RESOLVED", 1]
            ]
          }
        ]
      }
    }
  ];

  return {
    settings: {
      thresholds: {
        ...DEFAULT_THRESHOLD_SETTINGS
      }
    },
    users,
    devices,
    alerts,
    reports,
    resetTokens: {}
  };
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadStore() {
  const initialStore = createInitialStore();

  if (typeof window === "undefined") {
    return initialStore;
  }

  const storedValue = window.localStorage.getItem(DEMO_STORAGE_KEY);

  if (!storedValue) {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(initialStore));
    return initialStore;
  }

  const parsed = safeJsonParse(storedValue, initialStore);
  return {
    ...initialStore,
    ...parsed
  };
}

function saveStore(store) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(store));
  }

  return store;
}

function parsePayload(config) {
  if (!config?.data) {
    return {};
  }

  if (typeof config.data === "string") {
    return safeJsonParse(config.data, {});
  }

  return config.data;
}

function parseQuery(config) {
  if (config?.params) {
    return config.params;
  }

  try {
    const normalizedUrl = config?.url?.startsWith("http")
      ? new URL(config.url)
      : new URL(config?.url ?? "/", "http://demo.local");

    return Object.fromEntries(normalizedUrl.searchParams.entries());
  } catch {
    return {};
  }
}

function normalizeUrl(url = "") {
  const pathname = url.startsWith("http")
    ? new URL(url).pathname
    : String(url).split("?")[0];

  return pathname.replace(/^\/api\/v\d+/, "") || "/";
}

function sanitizeUser(user) {
  const { password: _password, ...rest } = user;

  return {
    ...clone(rest),
    previewMode: true
  };
}

function buildToken(userId) {
  return `${DEMO_TOKEN_PREFIX}${userId}`;
}

function parseDemoToken(token) {
  if (typeof token !== "string" || !token.startsWith(DEMO_TOKEN_PREFIX)) {
    return null;
  }

  return token.slice(DEMO_TOKEN_PREFIX.length);
}

function extractAccessToken(config) {
  const authHeader =
    config?.headers?.Authorization ?? config?.headers?.authorization ?? "";

  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return readStoredSession()?.accessToken ?? null;
}

function getCurrentUser(config, store) {
  const tokenUserId = parseDemoToken(extractAccessToken(config));

  if (!tokenUserId) {
    return null;
  }

  return store.users.find((user) => user.id === tokenUserId) ?? null;
}

function ensureAuthenticated(config, store) {
  const user = getCurrentUser(config, store);

  if (!user) {
    throw createDemoError(config, 401, "Authentication required");
  }

  if (!user.isActive) {
    throw createDemoError(config, 403, "Your account is disabled");
  }

  return user;
}

function ensureRole(user, allowedRoles, config) {
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw createDemoError(config, 403, "Insufficient permissions");
  }
}

function withOwner(device, store) {
  const owner = store.users.find((user) => user.id === device.ownerId) ?? null;

  return {
    ...clone(device),
    owner: owner ? sanitizeUser(owner) : null,
    position: device.trail?.at(-1) ?? null
  };
}

function compareDateDescending(left, right, key) {
  return new Date(right[key]).getTime() - new Date(left[key]).getTime();
}

function paginate(items, query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.max(Number(query.limit) || 10, 1);
  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const startIndex = (page - 1) * limit;

  return {
    data: items.slice(startIndex, startIndex + limit),
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  };
}

function buildDashboardOverview(store) {
  const devices = store.devices.map((device) => withOwner(device, store));
  const onlineDevices = devices.filter((device) => device.status === "ONLINE").length;
  const todayAlerts = store.alerts.filter((alert) => {
    const alertDate = new Date(alert.triggeredAt);
    const now = new Date();

    return (
      alertDate.getUTCFullYear() === now.getUTCFullYear() &&
      alertDate.getUTCMonth() === now.getUTCMonth() &&
      alertDate.getUTCDate() === now.getUTCDate()
    );
  }).length;
  const criticalAlerts = store.alerts.filter((alert) => alert.severity === "Critical").length;
  const averageRiskScore =
    store.alerts.reduce((sum, alert) => sum + alert.riskScore, 0) /
    Math.max(store.alerts.length, 1);

  return {
    summary: {
      totalDevices: devices.length,
      onlineDevices,
      alertsToday: todayAlerts,
      criticalAlerts,
      overallRiskScore: Math.round(averageRiskScore),
      riskDelta: "+6%"
    },
    metrics: dashboardMetrics.map((metric) => {
      switch (metric.title) {
        case "Total Devices":
          return { ...metric, value: String(devices.length) };
        case "Online Devices":
          return { ...metric, value: String(onlineDevices) };
        case "Alerts Today":
          return { ...metric, value: String(todayAlerts) };
        case "Critical Alerts":
          return { ...metric, value: String(criticalAlerts) };
        default:
          return metric;
      }
    }),
    riskDistribution,
    threatTrend,
    latestAlerts: store.alerts
      .slice()
      .sort((left, right) => compareDateDescending(left, right, "triggeredAt"))
      .slice(0, 4)
      .map((alert, index) => ({
        id: alert.id,
        title: alert.title || dashboardLatestAlerts[index]?.title || "Live incident",
        device: alert.deviceId,
        severity: alert.severity,
        time: new Date(alert.triggeredAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        }),
        summary: alert.message
      })),
    systemHealth: systemHealth.map((item) =>
      item.label === "Database"
        ? {
            ...item,
            value: "Preview",
            detail: "Running against the local preview demo layer while backend services are offline."
          }
        : item
    ),
    responseChecklist
  };
}

function buildLiveMonitoring(store, query) {
  const statusFilter = String(query.status || "ALL").toUpperCase();
  const devices = store.devices
    .map((device) => withOwner(device, store))
    .map((device) => ({
      id: device.id,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      type: device.type,
      status: device.status,
      isOnline: device.status === "ONLINE",
      owner: device.owner,
      lastSeen: device.lastSeen,
      position: device.position,
      trail: clone(device.trail ?? [])
    }))
    .filter((device) => {
      if (statusFilter === "ONLINE") {
        return device.isOnline;
      }

      if (statusFilter === "OFFLINE") {
        return !device.isOnline;
      }

      return true;
    });

  const onlineDevices = devices.filter((device) => device.isOnline).length;

  return {
    summary: {
      totalDevices: devices.length,
      onlineDevices,
      offlineDevices: devices.length - onlineDevices,
      activeMarkers: devices.filter((device) => Boolean(device.position)).length,
      latestTimestamp: devices
        .map((device) => device.position?.timestamp ?? null)
        .filter(Boolean)
        .sort()
        .at(-1) ?? null
    },
    devices
  };
}

function buildReportPayload(report) {
  return clone(report);
}

function buildReportExportBlob(report, format) {
  const lines = [
    `${report.title}`,
    `Type: ${report.type}`,
    `Period: ${report.periodStart ?? "N/A"} -> ${report.periodEnd ?? "N/A"}`,
    "",
    "Summary"
  ];

  Object.entries(report.summary ?? {}).forEach(([key, value]) => {
    lines.push(`${key}: ${value}`);
  });

  const textPayload = lines.join("\n");
  const fileNameBase = report.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  if (format === "csv") {
    const csvRows = [["metric", "value"], ...Object.entries(report.summary ?? {})];
    const csv = csvRows.map((row) => row.join(",")).join("\n");

    return {
      buffer: new Blob([csv], { type: "text/csv" }),
      contentType: "text/csv",
      fileName: `${fileNameBase || "report"}.csv`
    };
  }

  if (format === "excel") {
    const tabular = [["metric", "value"], ...Object.entries(report.summary ?? {})]
      .map((row) => row.join("\t"))
      .join("\n");

    return {
      buffer: new Blob([tabular], { type: "application/vnd.ms-excel" }),
      contentType: "application/vnd.ms-excel",
      fileName: `${fileNameBase || "report"}.xls`
    };
  }

  const pseudoPdf = `%PDF-1.1
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${textPayload.length + 32} >>
stream
BT
/F1 12 Tf
72 720 Td
(${textPayload.replace(/[()]/g, "")}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000063 00000 n 
0000000122 00000 n 
0000000194 00000 n 
trailer
<< /Root 1 0 R /Size 5 >>
startxref
307
%%EOF`;

  return {
    buffer: new Blob([pseudoPdf], { type: "application/pdf" }),
    contentType: "application/pdf",
    fileName: `${fileNameBase || "report"}.pdf`
  };
}

function createDemoResponse(config, data, status = 200, headers = {}) {
  return Promise.resolve({
    data,
    status,
    statusText: status >= 400 ? "Error" : "OK",
    headers,
    config,
    request: {
      previewDemo: true
    }
  });
}

function createDemoError(config, status, message) {
  const error = new Error(message);
  error.config = config;
  error.response = {
    status,
    statusText: "Error",
    data: {
      success: false,
      message
    },
    headers: {},
    config
  };
  error.isAxiosError = true;
  return error;
}

function matchesSearch(haystack, search) {
  return String(haystack || "").toLowerCase().includes(String(search || "").toLowerCase());
}

function listUsers(store, query) {
  const filteredUsers = store.users
    .filter((user) => {
      if (query.search) {
        const matched =
          matchesSearch(user.name, query.search) || matchesSearch(user.email, query.search);

        if (!matched) {
          return false;
        }
      }

      if (query.role && user.role !== query.role) {
        return false;
      }

      if (query.status === "ACTIVE" && !user.isActive) {
        return false;
      }

      if (query.status === "BLOCKED" && user.isActive) {
        return false;
      }

      return true;
    })
    .sort((left, right) => compareDateDescending(left, right, "createdAt"))
    .map(sanitizeUser);

  return paginate(filteredUsers, query);
}

function listDevices(store, query) {
  const filteredDevices = store.devices
    .map((device) => withOwner(device, store))
    .filter((device) => {
      if (query.search) {
        const matched =
          matchesSearch(device.deviceName, query.search) ||
          matchesSearch(device.deviceId, query.search);

        if (!matched) {
          return false;
        }
      }

      if (query.status && device.status !== query.status) {
        return false;
      }

      if (query.type && device.type !== query.type) {
        return false;
      }

      if (query.online === "ONLINE" && device.status !== "ONLINE") {
        return false;
      }

      if (query.online === "OFFLINE" && device.status === "ONLINE") {
        return false;
      }

      return true;
    })
    .sort((left, right) => compareDateDescending(left, right, "createdAt"));

  return paginate(filteredDevices, query);
}

function listAlerts(store, query) {
  const filteredAlerts = store.alerts
    .filter((alert) => {
      if (query.search) {
        const matched =
          matchesSearch(alert.title, query.search) ||
          matchesSearch(alert.deviceName, query.search) ||
          matchesSearch(alert.deviceId, query.search);

        if (!matched) {
          return false;
        }
      }

      if (query.severity && alert.severity !== query.severity) {
        return false;
      }

      if (query.status && alert.status !== query.status) {
        return false;
      }

      return true;
    })
    .slice()
    .sort((left, right) => compareDateDescending(left, right, "triggeredAt"));

  return paginate(filteredAlerts, query);
}

function listReports(store, query) {
  const reports = store.reports
    .slice()
    .sort((left, right) => compareDateDescending(left, right, "createdAt"))
    .map(buildReportPayload);

  return paginate(reports, query);
}

function mergeSettings(user, store) {
  return {
    theme: user.preferences?.theme ?? "dark",
    notifications: {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...user.preferences?.notifications
    },
    thresholds: {
      ...DEFAULT_THRESHOLD_SETTINGS,
      ...store.settings?.thresholds
    }
  };
}

function createGeneratedReport(payload, store) {
  const alerts = store.alerts
    .filter((alert) => {
      if (payload.deviceId && alert.deviceId !== payload.deviceId) {
        return false;
      }

      if (payload.severity && alert.severity !== payload.severity) {
        return false;
      }

      if (payload.status && alert.status !== payload.status) {
        return false;
      }

      return true;
    });

  const affectedDeviceIds = new Set(alerts.map((alert) => alert.deviceId));
  const criticalAlerts = alerts.filter((alert) => alert.severity === "Critical").length;
  const openAlerts = alerts.filter((alert) => alert.status === "OPEN").length;
  const averageRiskScore =
    alerts.reduce((sum, alert) => sum + alert.riskScore, 0) / Math.max(alerts.length, 1);

  return {
    id: `report-demo-${crypto.randomUUID()}`,
    title: payload.title?.trim() || `${payload.type} Preview Report`,
    type: payload.type,
    periodStart: payload.periodStart || daysAgo(7),
    periodEnd: payload.periodEnd || new Date().toISOString(),
    createdAt: new Date().toISOString(),
    summary: {
      totalDevices: store.devices.length,
      activeDeviceCount: store.devices.filter((device) => device.status !== "DISABLED").length,
      totalAlerts: alerts.length,
      criticalAlerts,
      openAlerts,
      totalIncidents: alerts.length,
      affectedDeviceCount: affectedDeviceIds.size,
      averageRiskScore: Number(averageRiskScore.toFixed(2))
    },
    data: {
      sections: [
        {
          title: "Severity Breakdown",
          rows: ["Low", "Medium", "High", "Critical"].map((severity) => [
            severity,
            alerts.filter((alert) => alert.severity === severity).length
          ])
        },
        {
          title: "Status Breakdown",
          rows: ["OPEN", "ACKNOWLEDGED", "RESOLVED", "FALSE_POSITIVE"].map((status) => [
            status,
            alerts.filter((alert) => alert.status === status).length
          ])
        }
      ]
    }
  };
}

function getAlertIndex(store, alertId) {
  return store.alerts.findIndex((alert) => alert.id === alertId);
}

function appendActionHistory(alert, action, user, note) {
  alert.updatedAt = new Date().toISOString();
  alert.actionHistory = [
    ...(alert.actionHistory ?? []),
    {
      action,
      timestamp: alert.updatedAt,
      note: note || "",
      actor: {
        name: user.name,
        role: user.role
      }
    }
  ];
}

async function routeDemoRequest(config) {
  const store = loadStore();
  const method = String(config?.method || "get").toUpperCase();
  const url = normalizeUrl(config?.url);
  const payload = parsePayload(config);
  const query = parseQuery(config);

  if (method === "POST" && url === "/auth/login") {
    const user = store.users.find(
      (entry) =>
        entry.email.toLowerCase() === String(payload.email || "").trim().toLowerCase()
    );

    if (!user || user.password !== payload.password) {
      throw createDemoError(config, 401, "Invalid email or password");
    }

    if (!user.isActive) {
      throw createDemoError(config, 403, "Your account is disabled");
    }

    user.lastLoginAt = new Date().toISOString();
    saveStore(store);

    const accessToken = buildToken(user.id);

    return createDemoResponse(config, {
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken: `demo-refresh-${user.id}`,
      user: sanitizeUser(user)
    });
  }

  if (method === "POST" && url === "/auth/register") {
    const existingUser = store.users.find(
      (user) => user.email.toLowerCase() === String(payload.email || "").trim().toLowerCase()
    );

    if (existingUser) {
      throw createDemoError(config, 409, "A user with this email already exists");
    }

    const nextUser = {
      id: `user-demo-${crypto.randomUUID()}`,
      name: String(payload.name || "").trim(),
      email: String(payload.email || "").trim().toLowerCase(),
      password: String(payload.password || ""),
      role: store.users.length === 0 ? payload.role || APP_ROLES.SUPER_ADMIN : APP_ROLES.VIEWER,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      preferences: {
        theme: "dark",
        notifications: {
          ...DEFAULT_NOTIFICATION_SETTINGS
        }
      }
    };

    store.users.unshift(nextUser);
    saveStore(store);

    return createDemoResponse(config, {
      success: true,
      message: "User registered successfully",
      accessToken: buildToken(nextUser.id),
      refreshToken: `demo-refresh-${nextUser.id}`,
      user: sanitizeUser(nextUser)
    }, 201);
  }

  if (method === "POST" && url === "/auth/forgot-password") {
    const user = store.users.find(
      (entry) => entry.email.toLowerCase() === String(payload.email || "").trim().toLowerCase()
    );

    if (user) {
      const token = `demo-reset-${user.id}`;
      store.resetTokens[token] = user.id;
      saveStore(store);

      return createDemoResponse(config, {
        success: true,
        message: "If the email exists, a password reset flow has been initiated",
        resetUrl: `${window.location.origin}/reset-password?token=${token}`
      });
    }

    return createDemoResponse(config, {
      success: true,
      message: "If the email exists, a password reset flow has been initiated"
    });
  }

  if (method === "POST" && url === "/auth/reset-password") {
    const userId = store.resetTokens[payload.token];
    const user = store.users.find((entry) => entry.id === userId);

    if (!user) {
      throw createDemoError(config, 400, "Reset token is invalid or expired");
    }

    user.password = String(payload.password || "");
    user.updatedAt = new Date().toISOString();
    delete store.resetTokens[payload.token];
    saveStore(store);

    return createDemoResponse(config, {
      success: true,
      message: "Password reset successful",
      accessToken: buildToken(user.id),
      refreshToken: `demo-refresh-${user.id}`,
      user: sanitizeUser(user)
    });
  }

  if (method === "POST" && url === "/auth/refresh-token") {
    const session = readStoredSession();
    const user = session?.accessToken
      ? store.users.find((entry) => entry.id === parseDemoToken(session.accessToken))
      : null;

    if (!user) {
      throw createDemoError(config, 401, "Refresh token is required");
    }

    return createDemoResponse(config, {
      success: true,
      message: "Session refreshed successfully",
      accessToken: buildToken(user.id),
      refreshToken: `demo-refresh-${user.id}`,
      user: sanitizeUser(user)
    });
  }

  if (method === "POST" && url === "/auth/logout") {
    return createDemoResponse(config, {
      success: true,
      message: "Logout successful"
    });
  }

  if (method === "GET" && url === "/auth/me") {
    const user = ensureAuthenticated(config, store);

    return createDemoResponse(config, {
      success: true,
      user: sanitizeUser(user)
    });
  }

  if (method === "GET" && url === "/dashboard/overview") {
    ensureAuthenticated(config, store);

    return createDemoResponse(config, {
      success: true,
      overview: buildDashboardOverview(store)
    });
  }

  if (method === "GET" && url === "/profile") {
    const user = ensureAuthenticated(config, store);

    return createDemoResponse(config, {
      success: true,
      user: sanitizeUser(user)
    });
  }

  if (method === "PATCH" && url === "/profile") {
    const user = ensureAuthenticated(config, store);

    if (payload.email) {
      const emailInUse = store.users.some(
        (entry) =>
          entry.id !== user.id &&
          entry.email.toLowerCase() === String(payload.email).trim().toLowerCase()
      );

      if (emailInUse) {
        throw createDemoError(config, 409, "A user with this email already exists");
      }
    }

    user.name = String(payload.name || user.name).trim() || user.name;
    user.email = String(payload.email || user.email).trim().toLowerCase() || user.email;
    user.updatedAt = new Date().toISOString();
    saveStore(store);

    return createDemoResponse(config, {
      success: true,
      user: sanitizeUser(user)
    });
  }

  if (method === "GET" && url === "/settings") {
    const user = ensureAuthenticated(config, store);

    return createDemoResponse(config, {
      success: true,
      settings: mergeSettings(user, store)
    });
  }

  if (method === "PATCH" && url === "/settings") {
    const user = ensureAuthenticated(config, store);

    user.preferences = {
      ...user.preferences,
      ...(payload.theme ? { theme: payload.theme } : {}),
      notifications: {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...user.preferences?.notifications,
        ...payload.notifications
      }
    };

    if (
      payload.thresholds &&
      [APP_ROLES.SUPER_ADMIN, APP_ROLES.SECURITY_ANALYST].includes(user.role)
    ) {
      store.settings.thresholds = {
        ...store.settings.thresholds,
        ...payload.thresholds
      };
    }

    user.updatedAt = new Date().toISOString();
    saveStore(store);

    return createDemoResponse(config, {
      success: true,
      settings: mergeSettings(user, store)
    });
  }

  if (method === "GET" && url === "/users") {
    const user = ensureAuthenticated(config, store);
    ensureRole(user, [APP_ROLES.SUPER_ADMIN], config);

    const result = listUsers(store, query);
    return createDemoResponse(config, {
      success: true,
      ...result
    });
  }

  if (method === "POST" && url === "/users") {
    const user = ensureAuthenticated(config, store);
    ensureRole(user, [APP_ROLES.SUPER_ADMIN], config);

    const nextUser = {
      id: `user-demo-${crypto.randomUUID()}`,
      name: String(payload.name || "").trim(),
      email: String(payload.email || "").trim().toLowerCase(),
      password: String(payload.password || ""),
      role: payload.role || APP_ROLES.VIEWER,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
      preferences: {
        theme: "dark",
        notifications: {
          ...DEFAULT_NOTIFICATION_SETTINGS
        }
      }
    };

    store.users.unshift(nextUser);
    saveStore(store);

    return createDemoResponse(config, {
      success: true,
      user: sanitizeUser(nextUser)
    }, 201);
  }

  if (method === "PATCH" && /^\/users\/[^/]+$/.test(url)) {
    const actor = ensureAuthenticated(config, store);
    ensureRole(actor, [APP_ROLES.SUPER_ADMIN], config);

    const userId = url.split("/")[2];
    const targetUser = store.users.find((entry) => entry.id === userId);

    if (!targetUser) {
      throw createDemoError(config, 404, "User not found");
    }

    targetUser.name = String(payload.name || targetUser.name).trim();
    targetUser.email = String(payload.email || targetUser.email).trim().toLowerCase();
    targetUser.role = payload.role || targetUser.role;

    if (payload.password) {
      targetUser.password = String(payload.password);
    }

    targetUser.updatedAt = new Date().toISOString();
    saveStore(store);

    return createDemoResponse(config, {
      success: true,
      user: sanitizeUser(targetUser)
    });
  }

  if (method === "PATCH" && /^\/users\/[^/]+\/block$/.test(url)) {
    const actor = ensureAuthenticated(config, store);
    ensureRole(actor, [APP_ROLES.SUPER_ADMIN], config);

    const userId = url.split("/")[2];
    const targetUser = store.users.find((entry) => entry.id === userId);

    if (!targetUser) {
      throw createDemoError(config, 404, "User not found");
    }

    targetUser.isActive = false;
    targetUser.updatedAt = new Date().toISOString();
    saveStore(store);

    return createDemoResponse(config, {
      success: true,
      user: sanitizeUser(targetUser)
    });
  }

  if (method === "PATCH" && /^\/users\/[^/]+\/unblock$/.test(url)) {
    const actor = ensureAuthenticated(config, store);
    ensureRole(actor, [APP_ROLES.SUPER_ADMIN], config);

    const userId = url.split("/")[2];
    const targetUser = store.users.find((entry) => entry.id === userId);

    if (!targetUser) {
      throw createDemoError(config, 404, "User not found");
    }

    targetUser.isActive = true;
    targetUser.updatedAt = new Date().toISOString();
    saveStore(store);

    return createDemoResponse(config, {
      success: true,
      user: sanitizeUser(targetUser)
    });
  }

  if (method === "DELETE" && /^\/users\/[^/]+$/.test(url)) {
    const actor = ensureAuthenticated(config, store);
    ensureRole(actor, [APP_ROLES.SUPER_ADMIN], config);

    const userId = url.split("/")[2];
    store.users = store.users.filter((entry) => entry.id !== userId);
    store.devices = store.devices.map((device) =>
      device.ownerId === userId
        ? {
            ...device,
            ownerId: null
          }
        : device
    );
    saveStore(store);

    return createDemoResponse(config, {
      success: true,
      message: "User deleted successfully"
    });
  }

  if (method === "GET" && url === "/devices") {
    ensureAuthenticated(config, store);

    const result = listDevices(store, query);
    return createDemoResponse(config, {
      success: true,
      ...result
    });
  }

  if (method === "POST" && url === "/devices") {
    const actor = ensureAuthenticated(config, store);
    ensureRole(actor, [APP_ROLES.SUPER_ADMIN], config);

    const nextDevice = {
      id: `device-demo-${crypto.randomUUID()}`,
      deviceId: String(payload.deviceId || "").trim().toUpperCase(),
      deviceName: String(payload.deviceName || "").trim(),
      type: payload.type || "TRACKER",
      ownerId: payload.owner || null,
      status: payload.status || "OFFLINE",
      lastSeen: payload.status === "ONLINE" ? new Date().toISOString() : null,
      notes: payload.notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      trail: payload.status === "ONLINE"
        ? [
            {
              latitude: 24.8607,
              longitude: 67.0011,
              speed: 0,
              accuracy: 12,
              heading: 0,
              timestamp: new Date().toISOString()
            }
          ]
        : []
    };

    store.devices.unshift(nextDevice);
    saveStore(store);

    return createDemoResponse(config, {
      success: true,
      device: withOwner(nextDevice, store)
    }, 201);
  }

  if (method === "PATCH" && /^\/devices\/[^/]+$/.test(url)) {
    const actor = ensureAuthenticated(config, store);
    ensureRole(actor, [APP_ROLES.SUPER_ADMIN], config);

    const deviceId = url.split("/")[2];
    const device = store.devices.find((entry) => entry.id === deviceId);

    if (!device) {
      throw createDemoError(config, 404, "Device not found");
    }

    device.deviceId = String(payload.deviceId || device.deviceId).trim().toUpperCase();
    device.deviceName = String(payload.deviceName || device.deviceName).trim();
    device.type = payload.type || device.type;
    device.ownerId = payload.owner || null;
    device.status = payload.status || device.status;
    device.notes = payload.notes ?? device.notes;
    device.updatedAt = new Date().toISOString();

    if (device.status === "ONLINE" && !device.lastSeen) {
      device.lastSeen = new Date().toISOString();
    }

    saveStore(store);

    return createDemoResponse(config, {
      success: true,
      device: withOwner(device, store)
    });
  }

  if (method === "DELETE" && /^\/devices\/[^/]+$/.test(url)) {
    const actor = ensureAuthenticated(config, store);
    ensureRole(actor, [APP_ROLES.SUPER_ADMIN], config);

    const deviceId = url.split("/")[2];
    store.devices = store.devices.filter((entry) => entry.id !== deviceId);
    store.alerts = store.alerts.filter((entry) => entry.deviceId !== deviceId);
    saveStore(store);

    return createDemoResponse(config, {
      success: true,
      message: "Device deleted successfully"
    });
  }

  if (method === "GET" && url === "/gps/live") {
    ensureAuthenticated(config, store);

    return createDemoResponse(config, {
      success: true,
      ...buildLiveMonitoring(store, query)
    });
  }

  if (method === "GET" && url === "/alerts") {
    ensureAuthenticated(config, store);

    const result = listAlerts(store, query);
    return createDemoResponse(config, {
      success: true,
      ...result
    });
  }

  if (method === "GET" && /^\/alerts\/[^/]+$/.test(url)) {
    ensureAuthenticated(config, store);

    const alertId = url.split("/")[2];
    const alert = store.alerts.find((entry) => entry.id === alertId);

    if (!alert) {
      throw createDemoError(config, 404, "Alert not found");
    }

    return createDemoResponse(config, {
      success: true,
      alert: clone(alert)
    });
  }

  if (method === "PATCH" && /^\/alerts\/[^/]+\/resolve$/.test(url)) {
    const user = ensureAuthenticated(config, store);
    ensureRole(user, [APP_ROLES.SUPER_ADMIN, APP_ROLES.SECURITY_ANALYST], config);

    const alertIndex = getAlertIndex(store, url.split("/")[2]);

    if (alertIndex < 0) {
      throw createDemoError(config, 404, "Alert not found");
    }

    store.alerts[alertIndex].status = "RESOLVED";
    appendActionHistory(store.alerts[alertIndex], "RESOLVED", user, payload.note);
    saveStore(store);

    return createDemoResponse(config, {
      success: true,
      alert: clone(store.alerts[alertIndex])
    });
  }

  if (method === "PATCH" && /^\/alerts\/[^/]+\/false-positive$/.test(url)) {
    const user = ensureAuthenticated(config, store);
    ensureRole(user, [APP_ROLES.SUPER_ADMIN, APP_ROLES.SECURITY_ANALYST], config);

    const alertIndex = getAlertIndex(store, url.split("/")[2]);

    if (alertIndex < 0) {
      throw createDemoError(config, 404, "Alert not found");
    }

    store.alerts[alertIndex].status = "FALSE_POSITIVE";
    appendActionHistory(store.alerts[alertIndex], "FALSE_POSITIVE", user, payload.reason);
    saveStore(store);

    return createDemoResponse(config, {
      success: true,
      alert: clone(store.alerts[alertIndex])
    });
  }

  if (method === "PATCH" && /^\/alerts\/[^/]+\/escalate$/.test(url)) {
    const user = ensureAuthenticated(config, store);
    ensureRole(user, [APP_ROLES.SUPER_ADMIN, APP_ROLES.SECURITY_ANALYST], config);

    const alertIndex = getAlertIndex(store, url.split("/")[2]);

    if (alertIndex < 0) {
      throw createDemoError(config, 404, "Alert not found");
    }

    appendActionHistory(store.alerts[alertIndex], "ESCALATED", user, payload.note);
    saveStore(store);

    return createDemoResponse(config, {
      success: true,
      alert: clone(store.alerts[alertIndex])
    });
  }

  if (method === "DELETE" && /^\/alerts\/[^/]+$/.test(url)) {
    const user = ensureAuthenticated(config, store);
    ensureRole(user, [APP_ROLES.SUPER_ADMIN], config);

    const alertId = url.split("/")[2];
    store.alerts = store.alerts.filter((entry) => entry.id !== alertId);
    saveStore(store);

    return createDemoResponse(config, {
      success: true,
      message: "Alert deleted successfully"
    });
  }

  if (method === "GET" && url === "/reports") {
    ensureAuthenticated(config, store);

    const result = listReports(store, query);
    return createDemoResponse(config, {
      success: true,
      ...result
    });
  }

  if (method === "POST" && url === "/reports") {
    const user = ensureAuthenticated(config, store);
    ensureRole(user, [APP_ROLES.SUPER_ADMIN, APP_ROLES.SECURITY_ANALYST], config);

    const report = createGeneratedReport(payload, store);
    store.reports.unshift(report);
    saveStore(store);

    return createDemoResponse(config, {
      success: true,
      report: buildReportPayload(report)
    }, 201);
  }

  if (method === "GET" && /^\/reports\/[^/]+$/.test(url)) {
    ensureAuthenticated(config, store);

    const reportId = url.split("/")[2];
    const report = store.reports.find((entry) => entry.id === reportId);

    if (!report) {
      throw createDemoError(config, 404, "Report not found");
    }

    return createDemoResponse(config, {
      success: true,
      report: buildReportPayload(report)
    });
  }

  if (method === "GET" && /^\/reports\/[^/]+\/export$/.test(url)) {
    ensureAuthenticated(config, store);

    const reportId = url.split("/")[2];
    const report = store.reports.find((entry) => entry.id === reportId);

    if (!report) {
      throw createDemoError(config, 404, "Report not found");
    }

    const format = String(query.format || "pdf").toLowerCase();
    const exportFile = buildReportExportBlob(report, format);

    return createDemoResponse(
      config,
      exportFile.buffer,
      200,
      {
        "content-disposition": `attachment; filename="${exportFile.fileName}"`,
        "content-type": exportFile.contentType
      }
    );
  }

  throw createDemoError(config, 404, `Preview route not implemented for ${method} ${url}`);
}

export function isDemoAccessToken(token) {
  return Boolean(parseDemoToken(token));
}

export function hasActiveDemoSession() {
  const session = readStoredSession();

  return Boolean(
    session?.user?.previewMode ||
      isDemoAccessToken(session?.accessToken)
  );
}

export async function buildDemoResponse(config) {
  return routeDemoRequest(config);
}
