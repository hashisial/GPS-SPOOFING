const demoDevices = {
  vessel: {
    id: "device-demo-vsl-203",
    callsign: "Drone-AX",
    label: "Recon Drone AX",
    fleet: "Capital Grid",
    status: "ACTIVE"
  },
  aircraft: {
    id: "device-demo-aer-447",
    callsign: "Tracker-X",
    label: "Tracker-X Mobile",
    fleet: "North Sector",
    status: "ACTIVE"
  },
  ground: {
    id: "device-demo-ugv-019",
    callsign: "Sentinel-7",
    label: "Sentinel Rover 7",
    fleet: "South Sector",
    status: "MAINTENANCE"
  }
};

export const mockGpsLogs = [
  {
    id: "gps-demo-001",
    deviceId: demoDevices.vessel.id,
    latitude: 33.6844,
    longitude: 73.0479,
    speedKph: 32,
    headingDegrees: 74,
    signalStrength: 86,
    accuracyMeters: 8,
    satelliteCount: 12,
    timestamp: "2026-04-18T05:00:00.000Z",
    isSpoofed: false,
    spoofingScore: 19,
    anomalyFlags: [],
    device: demoDevices.vessel,
    alert: null
  },
  {
    id: "gps-demo-002",
    deviceId: demoDevices.vessel.id,
    latitude: 33.6888,
    longitude: 73.0543,
    speedKph: 31,
    headingDegrees: 78,
    signalStrength: 82,
    accuracyMeters: 10,
    satelliteCount: 11,
    timestamp: "2026-04-18T05:04:00.000Z",
    isSpoofed: false,
    spoofingScore: 22,
    anomalyFlags: [],
    device: demoDevices.vessel,
    alert: null
  },
  {
    id: "gps-demo-003",
    deviceId: demoDevices.vessel.id,
    latitude: 33.7438,
    longitude: 73.1935,
    speedKph: 312,
    headingDegrees: 118,
    signalStrength: 28,
    accuracyMeters: 220,
    satelliteCount: 3,
    timestamp: "2026-04-18T05:07:00.000Z",
    isSpoofed: true,
    spoofingScore: 97,
    anomalyFlags: [
      "SUDDEN_LOCATION_JUMP",
      "IMPOSSIBLE_SPEED",
      "SIGNAL_INCONSISTENCY",
      "ACCURACY_ANOMALY"
    ],
    device: demoDevices.vessel,
    alert: null
  },
  {
    id: "gps-demo-004",
    deviceId: demoDevices.vessel.id,
    latitude: 33.7295,
    longitude: 73.1682,
    speedKph: 65,
    headingDegrees: 121,
    signalStrength: 34,
    accuracyMeters: 118,
    satelliteCount: 5,
    timestamp: "2026-04-18T05:11:00.000Z",
    isSpoofed: false,
    spoofingScore: 41,
    anomalyFlags: [],
    device: demoDevices.vessel,
    alert: null
  },
  {
    id: "gps-demo-005",
    deviceId: demoDevices.aircraft.id,
    latitude: 33.7012,
    longitude: 73.0411,
    speedKph: 42,
    headingDegrees: 36,
    signalStrength: 78,
    accuracyMeters: 12,
    satelliteCount: 14,
    timestamp: "2026-04-18T05:01:00.000Z",
    isSpoofed: false,
    spoofingScore: 26,
    anomalyFlags: [],
    device: demoDevices.aircraft,
    alert: null
  },
  {
    id: "gps-demo-006",
    deviceId: demoDevices.aircraft.id,
    latitude: 33.7089,
    longitude: 73.0605,
    speedKph: 44,
    headingDegrees: 41,
    signalStrength: 75,
    accuracyMeters: 14,
    satelliteCount: 13,
    timestamp: "2026-04-18T05:05:00.000Z",
    isSpoofed: false,
    spoofingScore: 28,
    anomalyFlags: [],
    device: demoDevices.aircraft,
    alert: null
  },
  {
    id: "gps-demo-007",
    deviceId: demoDevices.aircraft.id,
    latitude: 33.5821,
    longitude: 72.9648,
    speedKph: 298,
    headingDegrees: 79,
    signalStrength: 32,
    accuracyMeters: 188,
    satelliteCount: 4,
    timestamp: "2026-04-18T05:09:00.000Z",
    isSpoofed: true,
    spoofingScore: 92,
    anomalyFlags: [
      "SUDDEN_LOCATION_JUMP",
      "SIGNAL_INCONSISTENCY",
      "ACCURACY_ANOMALY"
    ],
    device: demoDevices.aircraft,
    alert: null
  },
  {
    id: "gps-demo-008",
    deviceId: demoDevices.aircraft.id,
    latitude: 33.6014,
    longitude: 72.9895,
    speedKph: 44,
    headingDegrees: 77,
    signalStrength: 54,
    accuracyMeters: 39,
    satelliteCount: 9,
    timestamp: "2026-04-18T05:12:00.000Z",
    isSpoofed: false,
    spoofingScore: 37,
    anomalyFlags: [],
    device: demoDevices.aircraft,
    alert: null
  },
  {
    id: "gps-demo-009",
    deviceId: demoDevices.ground.id,
    latitude: 33.6694,
    longitude: 73.0229,
    speedKph: 18,
    headingDegrees: 134,
    signalStrength: 71,
    accuracyMeters: 9,
    satelliteCount: 11,
    timestamp: "2026-04-18T05:02:00.000Z",
    isSpoofed: false,
    spoofingScore: 14,
    anomalyFlags: [],
    device: demoDevices.ground,
    alert: null
  },
  {
    id: "gps-demo-010",
    deviceId: demoDevices.ground.id,
    latitude: 33.6748,
    longitude: 73.0364,
    speedKph: 24,
    headingDegrees: 141,
    signalStrength: 69,
    accuracyMeters: 11,
    satelliteCount: 10,
    timestamp: "2026-04-18T05:06:00.000Z",
    isSpoofed: false,
    spoofingScore: 17,
    anomalyFlags: [],
    device: demoDevices.ground,
    alert: null
  },
  {
    id: "gps-demo-011",
    deviceId: demoDevices.ground.id,
    latitude: 33.6799,
    longitude: 73.0488,
    speedKph: 20,
    headingDegrees: 147,
    signalStrength: 67,
    accuracyMeters: 12,
    satelliteCount: 10,
    timestamp: "2026-04-18T05:10:00.000Z",
    isSpoofed: false,
    spoofingScore: 18,
    anomalyFlags: [],
    device: demoDevices.ground,
    alert: null
  },
  {
    id: "gps-demo-012",
    deviceId: demoDevices.ground.id,
    latitude: 33.6851,
    longitude: 73.0612,
    speedKph: 23,
    headingDegrees: 152,
    signalStrength: 66,
    accuracyMeters: 12,
    satelliteCount: 9,
    timestamp: "2026-04-18T05:14:00.000Z",
    isSpoofed: false,
    spoofingScore: 20,
    anomalyFlags: [],
    device: demoDevices.ground,
    alert: null
  }
];

export const mockAlerts = [
  {
    id: "alert-demo-001",
    deviceId: demoDevices.vessel.id,
    gpsLogId: "gps-demo-003",
    severity: "CRITICAL",
    status: "OPEN",
    title: "Spoofing detected for Drone-AX",
    description:
      "Triggered rules: SUDDEN_LOCATION_JUMP, IMPOSSIBLE_SPEED, SIGNAL_INCONSISTENCY, ACCURACY_ANOMALY.",
    triggeredRules: [
      "SUDDEN_LOCATION_JUMP",
      "IMPOSSIBLE_SPEED",
      "SIGNAL_INCONSISTENCY",
      "ACCURACY_ANOMALY"
    ],
    confidence: 97,
    computedSpeedKph: 312,
    distanceJumpMeters: 18700,
    signalDelta: -54,
    accuracyMeters: 220,
    detectedAt: "2026-04-18T05:07:00.000Z",
    device: demoDevices.vessel,
    gpsLog: {
      id: "gps-demo-003",
      latitude: 33.7438,
      longitude: 73.1935,
      timestamp: "2026-04-18T05:07:00.000Z"
    }
  },
  {
    id: "alert-demo-002",
    deviceId: demoDevices.aircraft.id,
    gpsLogId: "gps-demo-007",
    severity: "HIGH",
    status: "ACKNOWLEDGED",
    title: "Spoofing detected for Tracker-X",
    description:
      "Triggered rules: SUDDEN_LOCATION_JUMP, SIGNAL_INCONSISTENCY, ACCURACY_ANOMALY.",
    triggeredRules: [
      "SUDDEN_LOCATION_JUMP",
      "SIGNAL_INCONSISTENCY",
      "ACCURACY_ANOMALY"
    ],
    confidence: 92,
    computedSpeedKph: 298,
    distanceJumpMeters: 16400,
    signalDelta: -43,
    accuracyMeters: 188,
    detectedAt: "2026-04-18T05:09:00.000Z",
    device: demoDevices.aircraft,
    gpsLog: {
      id: "gps-demo-007",
      latitude: 33.5821,
      longitude: 72.9648,
      timestamp: "2026-04-18T05:09:00.000Z"
    }
  }
];

export const mockSystemSettings = {
  confidenceThreshold: 85,
  driftThresholdMeters: 1500,
  headingThresholdDegrees: 12,
  emailNotificationsEnabled: true,
  smsNotificationsEnabled: false,
  webhookNotificationsEnabled: false,
  webhookUrl: ""
};

export const mockNotificationPreferences = {
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: true,
  weeklyDigest: true,
  criticalOnly: false,
  preferredEmail: "analyst@gpsshield.local"
};

export const mockUsers = [
  {
    id: "user-demo-admin",
    name: "Command Admin",
    email: "admin@gpsshield.local",
    role: "ADMIN",
    isActive: true,
    reportCount: 12
  },
  {
    id: "user-demo-analyst",
    name: "Operations Analyst",
    email: "analyst@gpsshield.local",
    role: "USER",
    isActive: true,
    reportCount: 7
  },
  {
    id: "user-demo-auditor",
    name: "Threat Auditor",
    email: "auditor@gpsshield.local",
    role: "USER",
    isActive: false,
    reportCount: 3
  }
];

export const mockDevices = Object.values(demoDevices).map((device) => {
  const deviceLogs = mockGpsLogs.filter((log) => log.deviceId === device.id);
  const latestLog = deviceLogs.at(-1);
  const alertCount = mockAlerts.filter((alert) => alert.deviceId === device.id).length;

  return {
    ...device,
    latitude: latestLog?.latitude ?? null,
    longitude: latestLog?.longitude ?? null,
    detectionCount: deviceLogs.length,
    alertCount,
    notes:
      alertCount > 0
        ? "Flagged in the latest anomaly window and routed to the operations queue."
        : "Operating normally within the monitored fleet corridor."
  };
});
