import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin123!", 12);
  const userPasswordHash = await bcrypt.hash("User123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@gpsshield.local" },
    update: {
      name: "Operations Admin",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true
    },
    create: {
      name: "Operations Admin",
      email: "admin@gpsshield.local",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true
    }
  });

  await prisma.user.upsert({
    where: { email: "analyst@gpsshield.local" },
    update: {
      name: "Telemetry Analyst",
      passwordHash: userPasswordHash,
      role: Role.USER,
      isActive: true
    },
    create: {
      name: "Telemetry Analyst",
      email: "analyst@gpsshield.local",
      passwordHash: userPasswordHash,
      role: Role.USER,
      isActive: true
    }
  });

  await prisma.systemSetting.upsert({
    where: { id: "system" },
    update: {
      confidenceThreshold: 85,
      driftThresholdMeters: 1500,
      headingThresholdDegrees: 12,
      emailNotificationsEnabled: true,
      smsNotificationsEnabled: false,
      webhookNotificationsEnabled: false,
      webhookUrl: null
    },
    create: {
      id: "system",
      confidenceThreshold: 85,
      driftThresholdMeters: 1500,
      headingThresholdDegrees: 12,
      emailNotificationsEnabled: true,
      smsNotificationsEnabled: false,
      webhookNotificationsEnabled: false,
      webhookUrl: null
    }
  });

  await prisma.notificationPreference.upsert({
    where: { userId: admin.id },
    update: {
      preferredEmail: admin.email
    },
    create: {
      userId: admin.id,
      preferredEmail: admin.email
    }
  });

  const devices = await Promise.all([
    prisma.device.upsert({
      where: { callsign: "VSL-203" },
      update: {
        label: "Survey Vessel 203",
        fleet: "Arabian Sea",
        status: "ACTIVE",
        lastKnownLat: 24.8607,
        lastKnownLng: 67.0011,
        lastSeenAt: new Date("2026-04-18T08:12:00.000Z"),
        notes: "Primary maritime survey platform."
      },
      create: {
        callsign: "VSL-203",
        label: "Survey Vessel 203",
        fleet: "Arabian Sea",
        status: "ACTIVE",
        lastKnownLat: 24.8607,
        lastKnownLng: 67.0011,
        lastSeenAt: new Date("2026-04-18T08:12:00.000Z"),
        notes: "Primary maritime survey platform."
      }
    }),
    prisma.device.upsert({
      where: { callsign: "AER-447" },
      update: {
        label: "Recon Flight 447",
        fleet: "North Corridor",
        status: "ACTIVE",
        lastKnownLat: 31.5204,
        lastKnownLng: 74.3587,
        lastSeenAt: new Date("2026-04-18T07:52:00.000Z"),
        notes: "Airborne GNSS reconnaissance platform."
      },
      create: {
        callsign: "AER-447",
        label: "Recon Flight 447",
        fleet: "North Corridor",
        status: "ACTIVE",
        lastKnownLat: 31.5204,
        lastKnownLng: 74.3587,
        lastSeenAt: new Date("2026-04-18T07:52:00.000Z"),
        notes: "Airborne GNSS reconnaissance platform."
      }
    })
  ]);

  await prisma.report.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.gpsLog.deleteMany();

  const normalVesselLog = await prisma.gpsLog.create({
    data: {
      deviceId: devices[0].id,
      latitude: 24.8607,
      longitude: 67.0011,
      speedKph: 24,
      headingDegrees: 182,
      signalStrength: 78,
      accuracyMeters: 6,
      satelliteCount: 14,
      timestamp: new Date("2026-04-18T08:00:00.000Z"),
      isSpoofed: false,
      spoofingScore: 18,
      anomalyFlags: []
    }
  });

  const spoofedVesselLog = await prisma.gpsLog.create({
    data: {
      deviceId: devices[0].id,
      latitude: 25.2048,
      longitude: 55.2708,
      speedKph: 840,
      headingDegrees: 214,
      signalStrength: 31,
      accuracyMeters: 190,
      satelliteCount: 3,
      timestamp: new Date("2026-04-18T08:05:00.000Z"),
      isSpoofed: true,
      spoofingScore: 96,
      anomalyFlags: [
        "SUDDEN_LOCATION_JUMP",
        "IMPOSSIBLE_SPEED",
        "SIGNAL_INCONSISTENCY",
        "ACCURACY_ANOMALY"
      ]
    }
  });

  await prisma.alert.create({
    data: {
      deviceId: devices[0].id,
      gpsLogId: spoofedVesselLog.id,
      severity: "CRITICAL",
      status: "OPEN",
      title: "Spoofing suspected for Survey Vessel 203",
      description:
        "Device position jumped across regions with impossible computed speed, degraded signal quality, and abnormal accuracy.",
      triggeredRules: [
        "SUDDEN_LOCATION_JUMP",
        "IMPOSSIBLE_SPEED",
        "SIGNAL_INCONSISTENCY",
        "ACCURACY_ANOMALY"
      ],
      confidence: 96,
      computedSpeedKph: 840,
      distanceJumpMeters: 1184200,
      signalDelta: -47,
      accuracyMeters: 190,
      metadata: {
        previousLogId: normalVesselLog.id
      },
      detectedAt: spoofedVesselLog.timestamp
    }
  });

  await prisma.gpsLog.createMany({
    data: [
      {
        deviceId: devices[1].id,
        latitude: 31.5204,
        longitude: 74.3587,
        speedKph: 440,
        headingDegrees: 35,
        signalStrength: 81,
        accuracyMeters: 8,
        satelliteCount: 15,
        timestamp: new Date("2026-04-18T07:35:00.000Z"),
        isSpoofed: false,
        spoofingScore: 12,
        anomalyFlags: []
      },
      {
        deviceId: devices[1].id,
        latitude: 31.622,
        longitude: 74.455,
        speedKph: 452,
        headingDegrees: 32,
        signalStrength: 79,
        accuracyMeters: 9,
        satelliteCount: 14,
        timestamp: new Date("2026-04-18T07:52:00.000Z"),
        isSpoofed: false,
        spoofingScore: 14,
        anomalyFlags: []
      }
    ]
  });

  await prisma.report.create({
    data: {
      title: "Initial spoofing incident baseline",
      type: "SPOOFING_ANALYSIS",
      generatedById: admin.id,
      filters: {
        deviceId: devices[0].id
      },
      summary: {
        totalLogs: 4,
        spoofedLogs: 1,
        totalAlerts: 1,
        devicesMonitored: 2
      },
      alertCount: 1,
      logCount: 4
    }
  });

  console.log("Seeded GPS spoofing backend demo data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
