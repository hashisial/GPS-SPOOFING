import { ROLES } from "../../constants/roles.js";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_THRESHOLD_SETTINGS
} from "../../constants/settings.js";
import { SystemSettingsModel } from "../../models/SystemSettings.js";
import { resetDetectionThresholdCache } from "../detection/spoofingDetection.service.js";
import { UserModel } from "../../models/User.js";
import { ApiError } from "../../utils/ApiError.js";

const defaultSettings = {
  theme: "dark",
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  thresholds: DEFAULT_THRESHOLD_SETTINGS
};

function mergeSettings(preferences = {}, thresholds = DEFAULT_THRESHOLD_SETTINGS) {
  return {
    ...defaultSettings,
    ...preferences,
    notifications: {
      ...defaultSettings.notifications,
      ...preferences.notifications
    },
    thresholds: {
      ...defaultSettings.thresholds,
      ...thresholds
    }
  };
}

async function ensureUser(userId) {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw ApiError.notFound("Settings owner not found");
  }

  return user;
}

async function ensureSystemSettings() {
  let settings = await SystemSettingsModel.findOne({});

  if (!settings) {
    settings = await SystemSettingsModel.create({
      thresholds: DEFAULT_THRESHOLD_SETTINGS
    });
  }

  return settings;
}

function canManageThresholds(actor) {
  return [ROLES.SUPER_ADMIN, ROLES.SECURITY_ANALYST].includes(actor?.role);
}

export async function getSettings(userId) {
  const [user, systemSettings] = await Promise.all([
    ensureUser(userId),
    ensureSystemSettings()
  ]);

  return mergeSettings(user.preferences, systemSettings.thresholds);
}

export async function updateSettings(userId, actor, payload) {
  const [user, systemSettings] = await Promise.all([
    ensureUser(userId),
    ensureSystemSettings()
  ]);

  if (payload.thresholds && !canManageThresholds(actor)) {
    throw ApiError.forbidden("You are not allowed to update detection thresholds");
  }

  const nextUserPreferences = {
    ...user.preferences,
    ...(payload.theme ? { theme: payload.theme } : {}),
    notifications: {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...user.preferences?.notifications,
      ...payload.notifications
    }
  };

  user.preferences = {
    ...user.preferences,
    theme: nextUserPreferences.theme,
    notifications: nextUserPreferences.notifications
  };
  user.updatedBy = user.id;
  user.markModified("preferences");

  if (payload.thresholds) {
    systemSettings.thresholds = {
      ...DEFAULT_THRESHOLD_SETTINGS,
      ...systemSettings.thresholds,
      ...payload.thresholds
    };
    systemSettings.updatedBy = actor?.id ?? user.id;
    systemSettings.markModified("thresholds");
  }

  await Promise.all([
    user.save(),
    payload.thresholds ? systemSettings.save() : Promise.resolve()
  ]);

  if (payload.thresholds) {
    resetDetectionThresholdCache();
  }

  return mergeSettings(user.preferences, systemSettings.thresholds);
}
