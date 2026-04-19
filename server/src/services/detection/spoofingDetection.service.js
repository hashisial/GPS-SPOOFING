import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { ALERT_SEVERITIES, SPOOFING_RULES } from "../../constants/alert.js";
import { DEFAULT_THRESHOLD_SETTINGS } from "../../constants/settings.js";
import { GpsLogModel } from "../../models/GpsLog.js";
import { SystemSettingsModel } from "../../models/SystemSettings.js";
import { createSpoofingAlert } from "../alerts/alert.service.js";

const SETTINGS_CACHE_TTL_MS = 15_000;
let cachedThresholds = null;
let cachedThresholdsExpiresAt = 0;

export function resetDetectionThresholdCache() {
  cachedThresholds = null;
  cachedThresholdsExpiresAt = 0;
}

function toMilliseconds(value) {
  return new Date(value).getTime();
}

function haversineDistanceMeters(from, to) {
  const earthRadiusMeters = 6_371_000;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const deltaLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const deltaLng = ((to.longitude - from.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clamp(number, min, max) {
  return Math.min(max, Math.max(min, number));
}

function round(number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(number * factor) / factor;
}

function coordinatesMatch(left, right, precision = 5) {
  return (
    Number(left.latitude).toFixed(precision) === Number(right.latitude).toFixed(precision) &&
    Number(left.longitude).toFixed(precision) === Number(right.longitude).toFixed(precision)
  );
}

function calculateSpeedKmh(distanceMeters, elapsedMs) {
  if (elapsedMs <= 0) {
    return 0;
  }

  return (distanceMeters / 1000) / (elapsedMs / 3_600_000);
}

function getFallbackThresholds() {
  return {
    jumpDistanceMeters: env.detectionJumpDistanceMeters,
    unrealisticSpeedKph: env.detectionMaxSpeedKmh,
    signalAnomalyScore: DEFAULT_THRESHOLD_SETTINGS.signalAnomalyScore,
    accuracyThresholdM: env.detectionAccuracyFluctuationMeters
  };
}

async function loadDetectionThresholds() {
  if (cachedThresholds && cachedThresholdsExpiresAt > Date.now()) {
    return cachedThresholds;
  }

  const settings = await SystemSettingsModel.findOne({})
    .select("thresholds")
    .lean();

  cachedThresholds = {
    jumpDistanceMeters:
      (settings?.thresholds?.jumpDistanceKm ?? DEFAULT_THRESHOLD_SETTINGS.jumpDistanceKm) *
      1000,
    unrealisticSpeedKph:
      settings?.thresholds?.unrealisticSpeedKph ??
      DEFAULT_THRESHOLD_SETTINGS.unrealisticSpeedKph,
    signalAnomalyScore:
      settings?.thresholds?.signalAnomalyScore ??
      DEFAULT_THRESHOLD_SETTINGS.signalAnomalyScore,
    accuracyThresholdM:
      settings?.thresholds?.accuracyThresholdM ??
      DEFAULT_THRESHOLD_SETTINGS.accuracyThresholdM
  };
  cachedThresholdsExpiresAt = Date.now() + SETTINGS_CACHE_TTL_MS;

  return cachedThresholds;
}

function buildFinding(rule, riskScore, summary, evidence = {}) {
  return {
    rule,
    riskScore: clamp(Math.round(riskScore), 0, 100),
    summary,
    evidence
  };
}

function mapSeverity(riskScore) {
  if (riskScore >= 85) {
    return ALERT_SEVERITIES.CRITICAL;
  }

  if (riskScore >= 65) {
    return ALERT_SEVERITIES.HIGH;
  }

  if (riskScore >= 40) {
    return ALERT_SEVERITIES.MEDIUM;
  }

  return ALERT_SEVERITIES.LOW;
}

function aggregateRiskScore(findings) {
  if (findings.length === 0) {
    return 0;
  }

  const orderedScores = findings
    .map((finding) => finding.riskScore)
    .sort((left, right) => right - left);

  const baseScore = orderedScores[0];
  const stackedScore = orderedScores
    .slice(1)
    .reduce((sum, score) => sum + score * 0.25, 0);

  return clamp(Math.round(baseScore + stackedScore + (findings.length - 1) * 3), 0, 100);
}

async function loadRecentLogs(device, gpsLog) {
  const limit = Math.max(env.detectionRepeatedCoordinatesLimit, 6);

  return GpsLogModel.find({
    device: device.id,
    _id: {
      $ne: gpsLog.id
    },
    timestamp: {
      $lte: gpsLog.timestamp
    }
  })
    .sort({ timestamp: -1, receivedAt: -1 })
    .limit(limit)
    .lean();
}

function detectSuddenImpossibleJump(currentLog, previousLog, thresholds) {
  if (!previousLog) {
    return null;
  }

  const elapsedMs = toMilliseconds(currentLog.timestamp) - toMilliseconds(previousLog.timestamp);

  if (elapsedMs <= 0 || elapsedMs > env.detectionJumpWindowMs) {
    return null;
  }

  const distanceMeters = haversineDistanceMeters(currentLog, previousLog);

  if (distanceMeters < thresholds.jumpDistanceMeters) {
    return null;
  }

  const calculatedSpeedKmh = calculateSpeedKmh(distanceMeters, elapsedMs);
  const riskScore = clamp(
    68 +
      ((distanceMeters - thresholds.jumpDistanceMeters) /
        thresholds.jumpDistanceMeters) *
        18,
    68,
    90
  );

  return buildFinding(
    SPOOFING_RULES.SUDDEN_IMPOSSIBLE_JUMP,
    riskScore,
    `Device jumped ${round(distanceMeters)} meters in ${round(elapsedMs / 1000)} seconds`,
    {
      previousTimestamp: previousLog.timestamp,
      currentTimestamp: currentLog.timestamp,
      distanceMeters: round(distanceMeters),
      elapsedMs,
      calculatedSpeedKmh: round(calculatedSpeedKmh)
    }
  );
}

function detectUnrealisticSpeed(currentLog, previousLog, thresholds) {
  let calculatedSpeedKmh = 0;

  if (previousLog) {
    const elapsedMs = toMilliseconds(currentLog.timestamp) - toMilliseconds(previousLog.timestamp);

    if (elapsedMs > 0) {
      const distanceMeters = haversineDistanceMeters(currentLog, previousLog);
      calculatedSpeedKmh = calculateSpeedKmh(distanceMeters, elapsedMs);
    }
  }

  const observedSpeedKmh = Math.max(Number(currentLog.speed) || 0, calculatedSpeedKmh);

  if (observedSpeedKmh <= thresholds.unrealisticSpeedKph) {
    return null;
  }

  const riskScore = clamp(
    72 +
      ((observedSpeedKmh - thresholds.unrealisticSpeedKph) /
        thresholds.unrealisticSpeedKph) *
        28,
    72,
    96
  );

  return buildFinding(
    SPOOFING_RULES.UNREALISTIC_SPEED,
    riskScore,
    `Observed speed ${round(observedSpeedKmh)} km/h exceeded safe threshold`,
    {
      reportedSpeed: round(Number(currentLog.speed) || 0),
      calculatedSpeedKmh: round(calculatedSpeedKmh),
      thresholdKmh: thresholds.unrealisticSpeedKph
    }
  );
}

function detectTimestampMismatch(currentLog, previousLog) {
  const ingestionDriftMs = Math.abs(
    toMilliseconds(currentLog.receivedAt) - toMilliseconds(currentLog.timestamp)
  );
  const isOutOfOrder =
    previousLog &&
    toMilliseconds(currentLog.timestamp) <= toMilliseconds(previousLog.timestamp);

  if (!isOutOfOrder && ingestionDriftMs <= env.detectionTimestampDriftMs) {
    return null;
  }

  const riskScore = isOutOfOrder
    ? 82
    : clamp(
        55 +
          ((ingestionDriftMs - env.detectionTimestampDriftMs) /
            env.detectionTimestampDriftMs) *
            25,
        55,
        85
      );

  return buildFinding(
    SPOOFING_RULES.TIMESTAMP_MISMATCH,
    riskScore,
    isOutOfOrder
      ? "Incoming GPS timestamp is older than the previous device reading"
      : `Timestamp drift exceeded ${round(env.detectionTimestampDriftMs / 1000)} seconds`,
    {
      ingestionDriftMs,
      previousTimestamp: previousLog?.timestamp ?? null,
      currentTimestamp: currentLog.timestamp,
      receivedAt: currentLog.receivedAt
    }
  );
}

function detectRepeatedCoordinates(currentLog, recentLogs) {
  let repeatedCount = 1;

  for (const log of recentLogs) {
    if (coordinatesMatch(currentLog, log)) {
      repeatedCount += 1;
      continue;
    }

    break;
  }

  const movementReported = [currentLog, ...recentLogs.slice(0, repeatedCount - 1)].some(
    (log) => Number(log.speed) > 5 || Number(log.heading) > 0
  );

  if (
    repeatedCount < env.detectionRepeatedCoordinatesLimit ||
    !movementReported
  ) {
    return null;
  }

  const riskScore = clamp(48 + repeatedCount * 7, 48, 82);

  return buildFinding(
    SPOOFING_RULES.REPEATED_COORDINATES,
    riskScore,
    `Coordinates repeated across ${repeatedCount} consecutive moving samples`,
    {
      repeatedCount,
      latitude: currentLog.latitude,
      longitude: currentLog.longitude
    }
  );
}

function detectGeofenceViolation(currentLog) {
  if (
    !env.detectionGeofenceEnabled ||
    env.detectionGeofenceRadiusMeters <= 0
  ) {
    return null;
  }

  const distanceFromCenterMeters = haversineDistanceMeters(currentLog, {
    latitude: env.detectionGeofenceCenterLat,
    longitude: env.detectionGeofenceCenterLng
  });

  if (distanceFromCenterMeters <= env.detectionGeofenceRadiusMeters) {
    return null;
  }

  const overflowMeters = distanceFromCenterMeters - env.detectionGeofenceRadiusMeters;
  const riskScore = clamp(
    58 + (overflowMeters / env.detectionGeofenceRadiusMeters) * 24,
    58,
    88
  );

  return buildFinding(
    SPOOFING_RULES.GEOFENCE_VIOLATION,
    riskScore,
    `Device moved ${round(overflowMeters)} meters outside the configured geofence`,
    {
      distanceFromCenterMeters: round(distanceFromCenterMeters),
      geofenceRadiusMeters: env.detectionGeofenceRadiusMeters,
      center: {
        latitude: env.detectionGeofenceCenterLat,
        longitude: env.detectionGeofenceCenterLng
      }
    }
  );
}

function detectAccuracyFluctuation(currentLog, previousLog, thresholds) {
  if (!previousLog) {
    return null;
  }

  const previousAccuracy = Math.max(Number(previousLog.accuracy) || 0, 1);
  const currentAccuracy = Math.max(Number(currentLog.accuracy) || 0, 1);
  const deltaMeters = Math.abs(currentAccuracy - previousAccuracy);
  const ratio = Math.max(currentAccuracy, previousAccuracy) / Math.min(currentAccuracy, previousAccuracy);

  if (
    deltaMeters < thresholds.accuracyThresholdM ||
    ratio < env.detectionAccuracyFluctuationRatio
  ) {
    return null;
  }

  const riskScore = clamp(
    42 + (deltaMeters / thresholds.accuracyThresholdM) * 10,
    42,
    78
  );

  return buildFinding(
    SPOOFING_RULES.ACCURACY_FLUCTUATION,
    riskScore,
    `Accuracy shifted from ${round(previousAccuracy)}m to ${round(currentAccuracy)}m abruptly`,
    {
      previousAccuracy: round(previousAccuracy),
      currentAccuracy: round(currentAccuracy),
      deltaMeters: round(deltaMeters),
      ratio: round(ratio)
    }
  );
}

function detectTeleportMovement(currentLog, previousLog) {
  if (!previousLog) {
    return null;
  }

  const elapsedMs = toMilliseconds(currentLog.timestamp) - toMilliseconds(previousLog.timestamp);

  if (elapsedMs <= 0 || elapsedMs > env.detectionTeleportWindowMs) {
    return null;
  }

  const distanceMeters = haversineDistanceMeters(currentLog, previousLog);

  if (distanceMeters < env.detectionTeleportDistanceMeters) {
    return null;
  }

  return buildFinding(
    SPOOFING_RULES.TELEPORT_MOVEMENT,
    95,
    `Teleport pattern detected across ${round(distanceMeters)} meters in ${round(elapsedMs / 1000)} seconds`,
    {
      distanceMeters: round(distanceMeters),
      elapsedMs,
      previousTimestamp: previousLog.timestamp,
      currentTimestamp: currentLog.timestamp
    }
  );
}

export async function evaluateGpsLogForSpoofing({ device, gpsLog }) {
  let thresholds;

  try {
    thresholds = await loadDetectionThresholds();
  } catch (error) {
    logger.warn(
      {
        err: error,
        deviceId: device.deviceId
      },
      "Falling back to environment detection thresholds"
    );
    thresholds = getFallbackThresholds();
  }

  const recentLogs = await loadRecentLogs(device, gpsLog);
  const previousLog = recentLogs[0] ?? null;

  const findings = [
    detectSuddenImpossibleJump(gpsLog, previousLog, thresholds),
    detectUnrealisticSpeed(gpsLog, previousLog, thresholds),
    detectTimestampMismatch(gpsLog, previousLog),
    detectRepeatedCoordinates(gpsLog, recentLogs),
    detectGeofenceViolation(gpsLog),
    detectAccuracyFluctuation(gpsLog, previousLog, thresholds),
    detectTeleportMovement(gpsLog, previousLog)
  ].filter(Boolean);

  if (findings.length === 0) {
    return {
      detected: false,
      riskScore: 0,
      severity: null,
      findings: [],
      alert: null
    };
  }

  const riskScore = aggregateRiskScore(findings);

  if (riskScore < thresholds.signalAnomalyScore) {
    return {
      detected: false,
      riskScore,
      severity: null,
      findings,
      alert: null,
      suppressed: true
    };
  }

  const severity = mapSeverity(riskScore);
  const alert = await createSpoofingAlert({
    device,
    gpsLog,
    riskScore,
    severity,
    findings
  });

  logger.warn(
    {
      deviceId: device.deviceId,
      gpsLogId: gpsLog.id,
      alertId: alert.id,
      riskScore,
      severity,
      rules: findings.map((finding) => finding.rule)
    },
    "GPS spoofing alert generated"
  );

  return {
    detected: true,
    riskScore,
    severity,
    findings,
    alert
  };
}
