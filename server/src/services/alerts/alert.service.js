import { ALERT_ACTIONS } from "../../constants/alert.js";
import { AlertModel } from "../../models/Alert.js";
import { emitAlertCreated } from "../../sockets/index.js";

function sanitizeAlert(alert) {
  return typeof alert.toObject === "function" ? alert.toObject() : alert;
}

export async function createSpoofingAlert({ device, gpsLog, riskScore, severity, findings }) {
  const topFindings = findings.slice(0, 3).map((finding) => finding.summary);
  const title = `${severity} spoofing risk detected`;
  const message = topFindings.join(" | ");

  const alert = await AlertModel.create({
    device: device.id,
    deviceId: device.deviceId,
    deviceName: device.deviceName,
    gpsLog: gpsLog.id,
    title,
    message,
    riskScore,
    severity,
    findings,
    coordinates: {
      latitude: gpsLog.latitude,
      longitude: gpsLog.longitude
    },
    triggeredAt: gpsLog.timestamp,
    actionHistory: [
      {
        action: ALERT_ACTIONS.CREATED,
        note: "Alert created automatically by spoofing detection engine",
        actor: null,
        actorRole: "SYSTEM"
      }
    ]
  });

  const sanitizedAlert = sanitizeAlert(alert);
  emitAlertCreated(sanitizedAlert);
  return sanitizedAlert;
}
