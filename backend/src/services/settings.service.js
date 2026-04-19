import prisma from "../config/db.js";

function serializeSystemSettings(settings) {
  return {
    confidenceThreshold: settings.confidenceThreshold,
    driftThresholdMeters: settings.driftThresholdMeters,
    headingThresholdDegrees: settings.headingThresholdDegrees,
    emailNotificationsEnabled: settings.emailNotificationsEnabled,
    smsNotificationsEnabled: settings.smsNotificationsEnabled,
    webhookNotificationsEnabled: settings.webhookNotificationsEnabled,
    webhookUrl: settings.webhookUrl,
    updatedAt: settings.updatedAt
  };
}

function serializeNotificationPreference(preference) {
  return {
    emailEnabled: preference.emailEnabled,
    smsEnabled: preference.smsEnabled,
    pushEnabled: preference.pushEnabled,
    weeklyDigest: preference.weeklyDigest,
    criticalOnly: preference.criticalOnly,
    preferredEmail: preference.preferredEmail,
    updatedAt: preference.updatedAt
  };
}

export async function getSystemSettings() {
  const settings = await prisma.systemSetting.upsert({
    where: { id: "system" },
    update: {},
    create: {
      id: "system"
    }
  });

  return serializeSystemSettings(settings);
}

export async function updateSystemSettings(payload) {
  const settings = await prisma.systemSetting.upsert({
    where: { id: "system" },
    update: {
      confidenceThreshold: payload.confidenceThreshold,
      driftThresholdMeters: payload.driftThresholdMeters,
      headingThresholdDegrees: payload.headingThresholdDegrees,
      emailNotificationsEnabled: payload.emailNotificationsEnabled,
      smsNotificationsEnabled: payload.smsNotificationsEnabled,
      webhookNotificationsEnabled: payload.webhookNotificationsEnabled,
      webhookUrl: payload.webhookUrl || null
    },
    create: {
      id: "system",
      confidenceThreshold: payload.confidenceThreshold,
      driftThresholdMeters: payload.driftThresholdMeters,
      headingThresholdDegrees: payload.headingThresholdDegrees,
      emailNotificationsEnabled: payload.emailNotificationsEnabled,
      smsNotificationsEnabled: payload.smsNotificationsEnabled,
      webhookNotificationsEnabled: payload.webhookNotificationsEnabled,
      webhookUrl: payload.webhookUrl || null
    }
  });

  return serializeSystemSettings(settings);
}

export async function getUserNotificationPreferences(userId, userEmail) {
  const preference = await prisma.notificationPreference.upsert({
    where: {
      userId
    },
    update: {},
    create: {
      userId,
      preferredEmail: userEmail
    }
  });

  return serializeNotificationPreference(preference);
}

export async function updateUserNotificationPreferences(userId, payload) {
  const preference = await prisma.notificationPreference.upsert({
    where: {
      userId
    },
    update: {
      emailEnabled: payload.emailEnabled,
      smsEnabled: payload.smsEnabled,
      pushEnabled: payload.pushEnabled,
      weeklyDigest: payload.weeklyDigest,
      criticalOnly: payload.criticalOnly,
      preferredEmail: payload.preferredEmail || null
    },
    create: {
      userId,
      emailEnabled: payload.emailEnabled,
      smsEnabled: payload.smsEnabled,
      pushEnabled: payload.pushEnabled,
      weeklyDigest: payload.weeklyDigest,
      criticalOnly: payload.criticalOnly,
      preferredEmail: payload.preferredEmail || null
    }
  });

  return serializeNotificationPreference(preference);
}

