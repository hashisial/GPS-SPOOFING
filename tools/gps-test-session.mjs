#!/usr/bin/env node

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const entry = argv[index];

    if (!entry.startsWith("--")) {
      continue;
    }

    const key = entry.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      parsed[key] = "true";
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

function normalizeBaseUrl(value) {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");

  if (!trimmed) {
    return "http://localhost:5000/api/v1";
  }

  if (trimmed.includes("/api/")) {
    return trimmed;
  }

  return `${trimmed}/api/v1`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function encodeQuery(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

async function apiRequest({ baseUrl, path, method = "GET", token, headers = {}, body }) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error?.message ||
      payload?.error ||
      response.statusText;

    throw new Error(`${method} ${path} failed: ${message}`);
  }

  return payload;
}

async function login({ baseUrl, email, password }) {
  const payload = await apiRequest({
    baseUrl,
    path: "/auth/login",
    method: "POST",
    body: {
      email,
      password
    }
  });

  if (!payload.accessToken) {
    throw new Error("Login succeeded but no access token was returned");
  }

  return payload;
}

async function findDevice({ baseUrl, token, deviceId }) {
  const payload = await apiRequest({
    baseUrl,
    path: `/devices${encodeQuery({ search: deviceId, limit: 100 })}`,
    token
  });

  return (
    payload?.data?.find((entry) => String(entry.deviceId).toUpperCase() === deviceId.toUpperCase()) ||
    null
  );
}

async function ensureDevice({
  baseUrl,
  token,
  deviceId,
  deviceName,
  autoCreate
}) {
  const existing = await findDevice({
    baseUrl,
    token,
    deviceId
  });

  if (existing) {
    return {
      created: false,
      device: existing
    };
  }

  if (!autoCreate) {
    throw new Error(
      `Device ${deviceId} was not found. Create it first from the dashboard or rerun with --auto-create true.`
    );
  }

  const payload = await apiRequest({
    baseUrl,
    path: "/devices",
    method: "POST",
    token,
    body: {
      deviceName,
      deviceId,
      type: "TRACKER",
      status: "OFFLINE",
      notes: "Automated GPS test session device"
    }
  });

  return {
    created: true,
    device: payload.device
  };
}

async function provisionDeviceApiKey({ baseUrl, token, deviceMongoId }) {
  const payload = await apiRequest({
    baseUrl,
    path: `/devices/${deviceMongoId}/api-key`,
    method: "POST",
    token
  });

  if (!payload.deviceApiKey) {
    throw new Error("Device API key provisioning succeeded but no deviceApiKey was returned");
  }

  return payload;
}

function formatFindings(findings = []) {
  if (!Array.isArray(findings) || findings.length === 0) {
    return "none";
  }

  return findings.map((entry) => entry.rule).join(", ");
}

function buildTestSamples() {
  const startTime = Date.now() + 15_000;

  const withTimestamp = (offsetSeconds, values) => ({
    ...values,
    timestamp: new Date(startTime + offsetSeconds * 1000).toISOString()
  });

  return [
    {
      label: "normal-1",
      expectedAlert: false,
      payload: withTimestamp(0, {
        latitude: 24.8607,
        longitude: 67.0011,
        speed: 18,
        accuracy: 6,
        heading: 18
      })
    },
    {
      label: "normal-2",
      expectedAlert: false,
      payload: withTimestamp(20, {
        latitude: 24.8612,
        longitude: 67.0018,
        speed: 22,
        accuracy: 6,
        heading: 22
      })
    },
    {
      label: "normal-3",
      expectedAlert: false,
      payload: withTimestamp(40, {
        latitude: 24.8617,
        longitude: 67.0025,
        speed: 24,
        accuracy: 7,
        heading: 25
      })
    },
    {
      label: "spoof-jump",
      expectedAlert: true,
      payload: withTimestamp(70, {
        latitude: 24.9418,
        longitude: 67.1541,
        speed: 420,
        accuracy: 8,
        heading: 64
      })
    },
    {
      label: "repeat-1",
      expectedAlert: true,
      payload: withTimestamp(85, {
        latitude: 24.9418,
        longitude: 67.1541,
        speed: 28,
        accuracy: 9,
        heading: 66
      })
    },
    {
      label: "repeat-2",
      expectedAlert: true,
      payload: withTimestamp(100, {
        latitude: 24.9418,
        longitude: 67.1541,
        speed: 28,
        accuracy: 9,
        heading: 66
      })
    },
    {
      label: "repeat-3",
      expectedAlert: true,
      payload: withTimestamp(115, {
        latitude: 24.9418,
        longitude: 67.1541,
        speed: 28,
        accuracy: 9,
        heading: 66
      })
    },
    {
      label: "accuracy-spike",
      expectedAlert: true,
      payload: withTimestamp(130, {
        latitude: 24.9421,
        longitude: 67.1544,
        speed: 20,
        accuracy: 180,
        heading: 68
      })
    }
  ];
}

async function sendGpsSample({
  baseUrl,
  token,
  deviceId,
  sample,
  ingestMode,
  deviceApiKey
}) {
  const path = ingestMode === "device" ? "/gps/device-data" : "/gps/data";

  return apiRequest({
    baseUrl,
    path,
    method: "POST",
    token: ingestMode === "device" ? undefined : token,
    headers:
      ingestMode === "device"
        ? {
            "X-Device-ID": deviceId,
            "X-Device-Key": deviceApiKey
          }
        : {},
    body: {
      deviceId,
      ...sample.payload
    }
  });
}

async function fetchLiveSnapshot({ baseUrl, token, deviceId }) {
  return apiRequest({
    baseUrl,
    path: `/gps/live${encodeQuery({
      deviceId,
      trailLimit: 10
    })}`,
    token
  });
}

async function fetchAlertSummary({ baseUrl, token, deviceId }) {
  return apiRequest({
    baseUrl,
    path: `/alerts${encodeQuery({
      search: deviceId,
      limit: 5,
      sortBy: "triggeredAt",
      sortOrder: "desc"
    })}`,
    token
  });
}

function printUsage() {
  console.log(`
Usage:
  node tools/gps-test-session.mjs --email you@example.com --password yourPassword

Optional:
  --base-url      Backend base URL. Default: http://localhost:5000/api/v1
  --device-id     Business device ID. Default: FIELD-TEST-001
  --device-name   Device name. Default: Field Test Tracker
  --auto-create   true|false. Default: true
  --ingest-mode   user|device. Default: user
  --device-key    Existing device API key. Optional. If omitted in device mode, the script will generate one.

Example:
  node tools/gps-test-session.mjs ^
    --base-url https://gps-spoofing.onrender.com/api/v1 ^
    --email admin@example.com ^
    --password SuperSecret123 ^
    --device-id FIELD-TEST-001 ^
    --device-name "Field Test Tracker"

  node tools/gps-test-session.mjs ^
    --base-url https://gps-spoofing.onrender.com/api/v1 ^
    --email admin@example.com ^
    --password SuperSecret123 ^
    --device-id FIELD-TEST-001 ^
    --ingest-mode device
  `);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help === "true" || args.h === "true") {
    printUsage();
    return;
  }

  const email = args.email || process.env.TEST_EMAIL;
  const password = args.password || process.env.TEST_PASSWORD;

  if (!email || !password) {
    printUsage();
    throw new Error("Both --email and --password are required");
  }

  const baseUrl = normalizeBaseUrl(args["base-url"] || process.env.TEST_BASE_URL);
  const deviceId = String(args["device-id"] || process.env.TEST_DEVICE_ID || "FIELD-TEST-001")
    .trim()
    .toUpperCase();
  const deviceName = String(
    args["device-name"] || process.env.TEST_DEVICE_NAME || "Field Test Tracker"
  ).trim();
  const autoCreate = String(args["auto-create"] || process.env.TEST_AUTO_CREATE || "true")
    .trim()
    .toLowerCase() !== "false";
  const ingestMode = String(args["ingest-mode"] || process.env.TEST_INGEST_MODE || "user")
    .trim()
    .toLowerCase();
  let deviceApiKey = String(args["device-key"] || process.env.TEST_DEVICE_KEY || "").trim();

  if (!["user", "device"].includes(ingestMode)) {
    throw new Error("--ingest-mode must be either user or device");
  }

  console.log(`\nGPS spoofing test session starting...`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Device ID: ${deviceId}`);
  console.log(`Ingest mode: ${ingestMode}`);

  const auth = await login({
    baseUrl,
    email,
    password
  });

  console.log(`Logged in as ${auth.user.email} (${auth.user.role})`);

  const ensuredDevice = await ensureDevice({
    baseUrl,
    token: auth.accessToken,
    deviceId,
    deviceName,
    autoCreate
  });

  console.log(
    ensuredDevice.created
      ? `Created device ${ensuredDevice.device.deviceId}`
      : `Using existing device ${ensuredDevice.device.deviceId}`
  );

  if (ingestMode === "device") {
    if (!deviceApiKey) {
      const provisionedKey = await provisionDeviceApiKey({
        baseUrl,
        token: auth.accessToken,
        deviceMongoId: ensuredDevice.device.id
      });

      deviceApiKey = provisionedKey.deviceApiKey;
      console.log(
        `Provisioned device API key ending in ${provisionedKey.device.deviceApiKeyLastFour}`
      );
    } else {
      console.log(`Using supplied device API key ending in ${deviceApiKey.slice(-4)}`);
    }
  }

  const samples = buildTestSamples();
  let detectedCount = 0;

  for (const sample of samples) {
    const result = await sendGpsSample({
      baseUrl,
      token: auth.accessToken,
      deviceId,
      sample,
      ingestMode,
      deviceApiKey
    });

    const detection = result.detection || {};

    if (detection.detected) {
      detectedCount += 1;
    }

    console.log(`\n[${sample.label}]`);
    console.log(`  timestamp: ${sample.payload.timestamp}`);
    console.log(
      `  coords: ${sample.payload.latitude}, ${sample.payload.longitude} | speed=${sample.payload.speed} | accuracy=${sample.payload.accuracy}`
    );
    console.log(
      `  detected: ${Boolean(detection.detected)} | expected: ${sample.expectedAlert} | riskScore: ${detection.riskScore ?? 0} | severity: ${detection.severity ?? "none"}`
    );
    console.log(`  findings: ${formatFindings(detection.findings)}`);

    if (detection.alert?.id) {
      console.log(`  alertId: ${detection.alert.id}`);
    }

    await sleep(250);
  }

  const live = await fetchLiveSnapshot({
    baseUrl,
    token: auth.accessToken,
    deviceId
  });
  const alerts = await fetchAlertSummary({
    baseUrl,
    token: auth.accessToken,
    deviceId
  });

  const liveDevice =
    live.devices?.find((entry) => String(entry.deviceId).toUpperCase() === deviceId) || null;

  console.log(`\nSession summary`);
  console.log(`  samples sent: ${samples.length}`);
  console.log(`  detections returned: ${detectedCount}`);
  console.log(`  ingest mode: ${ingestMode}`);
  console.log(`  live trail points: ${liveDevice?.trail?.length ?? 0}`);
  console.log(`  latest live timestamp: ${live.summary?.latestTimestamp ?? "n/a"}`);
  console.log(`  recent alerts returned: ${alerts.data?.length ?? 0}`);

  if (alerts.data?.length) {
    console.log(`\nRecent alerts`);
    for (const alert of alerts.data) {
      console.log(
        `  - ${alert.severity} | risk=${alert.riskScore} | status=${alert.status} | ${alert.title}`
      );
    }
  }

  console.log(`\nDone.`);
}

main().catch((error) => {
  console.error(`\nTest session failed: ${error.message}`);
  process.exitCode = 1;
});
