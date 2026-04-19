export const DEFAULT_NOTIFICATION_SETTINGS = {
  emailAlerts: true,
  inAppAlerts: true,
  soundAlerts: true,
  digestFrequency: "DAILY"
};

export const DEFAULT_THRESHOLD_SETTINGS = {
  jumpDistanceKm: 1.5,
  unrealisticSpeedKph: 280,
  signalAnomalyScore: 40,
  accuracyThresholdM: 50
};

export const DEFAULT_USER_SETTINGS = {
  theme: "dark",
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  thresholds: DEFAULT_THRESHOLD_SETTINGS
};

export const SETTINGS_SCOPES = {
  GLOBAL: "GLOBAL"
};
