export const Roles = {
  ADMIN: "ADMIN",
  USER: "USER"
};

export const DeviceStatuses = {
  ACTIVE: "ACTIVE",
  MAINTENANCE: "MAINTENANCE",
  OFFLINE: "OFFLINE"
};

export const AlertSeverities = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL"
};

export const AlertStatuses = {
  OPEN: "OPEN",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  RESOLVED: "RESOLVED",
};

export const ReportTypes = {
  INCIDENT_SUMMARY: "INCIDENT_SUMMARY",
  DEVICE_ACTIVITY: "DEVICE_ACTIVITY",
  SPOOFING_ANALYSIS: "SPOOFING_ANALYSIS"
};

export const SpoofingRules = {
  SUDDEN_LOCATION_JUMP: "SUDDEN_LOCATION_JUMP",
  IMPOSSIBLE_SPEED: "IMPOSSIBLE_SPEED",
  SIGNAL_INCONSISTENCY: "SIGNAL_INCONSISTENCY",
  ACCURACY_ANOMALY: "ACCURACY_ANOMALY"
};

export const DetectionThresholds = {
  suddenJumpMeters: 5000,
  jumpWindowSeconds: 180,
  impossibleSpeedKph: 350,
  signalDelta: 30,
  minimumSatelliteCount: 4,
  abnormalAccuracyMeters: 120,
  accuracySpikeFactor: 4
};
