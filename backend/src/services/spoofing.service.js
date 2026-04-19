import {
  AlertSeverities,
  DetectionThresholds,
  SpoofingRules
} from "../constants/roles.js";
import { haversineDistanceMeters, hoursBetween } from "../utils/geo.js";

function buildSeverity(triggeredRules, computedSpeedKph, accuracyMeters) {
  if (
    triggeredRules.length >= 3 ||
    computedSpeedKph > DetectionThresholds.impossibleSpeedKph * 2 ||
    accuracyMeters > DetectionThresholds.abnormalAccuracyMeters * 2
  ) {
    return AlertSeverities.CRITICAL;
  }

  if (triggeredRules.length === 2) {
    return AlertSeverities.HIGH;
  }

  if (triggeredRules.length === 1) {
    return AlertSeverities.MEDIUM;
  }

  return AlertSeverities.LOW;
}

export function evaluateSpoofing(currentLog, previousLog) {
  const triggeredRules = [];
  let computedSpeedKph = Number(currentLog.speedKph ?? 0);
  let distanceJumpMeters = 0;
  let signalDelta = 0;

  if (previousLog) {
    distanceJumpMeters = haversineDistanceMeters(
      {
        latitude: previousLog.latitude,
        longitude: previousLog.longitude
      },
      {
        latitude: currentLog.latitude,
        longitude: currentLog.longitude
      }
    );

    const elapsedHours = hoursBetween(previousLog.timestamp, currentLog.timestamp);

    if (elapsedHours > 0) {
      computedSpeedKph = Math.max(computedSpeedKph, distanceJumpMeters / 1000 / elapsedHours);
    }

    const elapsedSeconds = elapsedHours * 3600;

    if (
      distanceJumpMeters >= DetectionThresholds.suddenJumpMeters &&
      elapsedSeconds <= DetectionThresholds.jumpWindowSeconds
    ) {
      triggeredRules.push(SpoofingRules.SUDDEN_LOCATION_JUMP);
    }

    signalDelta =
      Number(currentLog.signalStrength ?? 0) - Number(previousLog.signalStrength ?? 0);

    if (
      Math.abs(signalDelta) >= DetectionThresholds.signalDelta &&
      Number(currentLog.satelliteCount ?? 0) <= DetectionThresholds.minimumSatelliteCount
    ) {
      triggeredRules.push(SpoofingRules.SIGNAL_INCONSISTENCY);
    }

    if (
      currentLog.accuracyMeters &&
      previousLog.accuracyMeters &&
      currentLog.accuracyMeters >=
        previousLog.accuracyMeters * DetectionThresholds.accuracySpikeFactor
    ) {
      triggeredRules.push(SpoofingRules.ACCURACY_ANOMALY);
    }
  }

  if (computedSpeedKph >= DetectionThresholds.impossibleSpeedKph) {
    triggeredRules.push(SpoofingRules.IMPOSSIBLE_SPEED);
  }

  if (
    currentLog.accuracyMeters &&
    currentLog.accuracyMeters >= DetectionThresholds.abnormalAccuracyMeters &&
    !triggeredRules.includes(SpoofingRules.ACCURACY_ANOMALY)
  ) {
    triggeredRules.push(SpoofingRules.ACCURACY_ANOMALY);
  }

  const uniqueRules = [...new Set(triggeredRules)];
  const severity = buildSeverity(
    uniqueRules,
    computedSpeedKph,
    Number(currentLog.accuracyMeters ?? 0)
  );
  const confidence = Math.min(98, 42 + uniqueRules.length * 16 + Math.min(computedSpeedKph / 30, 18));

  return {
    isSpoofed: uniqueRules.length > 0,
    severity,
    confidence,
    triggeredRules: uniqueRules,
    computedSpeedKph: Number(computedSpeedKph.toFixed(2)),
    distanceJumpMeters: Number(distanceJumpMeters.toFixed(2)),
    signalDelta,
    accuracyMeters: currentLog.accuracyMeters ?? null,
    description:
      uniqueRules.length > 0
        ? `Triggered rules: ${uniqueRules.join(", ")}.`
        : "No spoofing indicators crossed configured thresholds."
  };
}
