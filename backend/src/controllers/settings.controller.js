import { asyncHandler } from "../utils/async-handler.js";
import {
  getSystemSettings,
  getUserNotificationPreferences,
  updateSystemSettings,
  updateUserNotificationPreferences
} from "../services/settings.service.js";

export const getSystemSettingsController = asyncHandler(async (req, res) => {
  void req;

  const settings = await getSystemSettings();

  return res.status(200).json({
    data: settings
  });
});

export const putSystemSettingsController = asyncHandler(async (req, res) => {
  const settings = await updateSystemSettings(req.body);

  return res.status(200).json({
    data: settings
  });
});

export const getNotificationPreferencesController = asyncHandler(async (req, res) => {
  const preference = await getUserNotificationPreferences(req.user.sub, req.user.email);

  return res.status(200).json({
    data: preference
  });
});

export const putNotificationPreferencesController = asyncHandler(async (req, res) => {
  const preference = await updateUserNotificationPreferences(req.user.sub, req.body);

  return res.status(200).json({
    data: preference
  });
});

