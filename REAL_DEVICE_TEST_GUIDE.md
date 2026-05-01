# Real Device Test Guide

Your project now supports two safe GPS ingestion paths:

- `POST /api/v1/gps/data`
  This is for human operators already logged in with JWT.
- `POST /api/v1/gps/device-data`
  This is the new hardware path for real trackers using a per-device API key.

That means you can now test with:

- dashboard user tokens for operator-driven validation
- direct device credentials for ESP32 or other programmable GPS hardware

## What this proves in real life

There are 3 levels of testing:

1. Logic test
This proves the spoofing engine detects jumps, speed anomalies, repeated coordinates, timestamp drift, geofence issues, and accuracy spikes.

2. Integration test
This proves live data reaches MongoDB, the dashboard updates, alerts are created, and WebSocket events emit correctly.

3. Hardware compatibility test
This proves a real sender board or tracker can talk to the backend directly.

Your project is ready for all 3 levels when you use:

- an ESP32 sender with the new device API key route, or
- a vendor gateway if your tracker cannot send HTTPS JSON

## Best real-world test path

The best first hardware test is:

- ESP32
- GPS module like `NEO-6M` or `NEO-M8N`
- Wi-Fi hotspot for first validation

After that works, you can move the same payload logic to:

- ESP32 + `SIM7600` 4G
- another LTE-capable MCU
- a vendor gateway for Teltonika or GT06

## Fastest complete device-auth test session

### 1. Start the stack or use the deployed backend

Local:

```powershell
npm install
npm run dev
```

Production:

- frontend on Vercel
- backend on Render
- MongoDB Atlas connected

### 2. Make sure you have a `SUPER_ADMIN`

You need an admin user because the test script can:

- create the device if it does not exist
- generate the device API key automatically

### 3. Run the hardware-style automated test session

This now simulates a real device using `x-device-id` and `x-device-key`:

```powershell
node tools/gps-test-session.mjs `
  --base-url https://gps-spoofing.onrender.com/api/v1 `
  --email your-admin-email@example.com `
  --password your-admin-password `
  --device-id FIELD-TEST-001 `
  --device-name "Field Test Tracker" `
  --ingest-mode device
```

What it does:

- logs in as admin
- creates the device if missing
- provisions a device API key if missing
- sends normal movement samples through `/gps/device-data`
- sends spoofing-like samples through `/gps/device-data`
- verifies live map data
- checks recent alerts

If this succeeds, your backend is ready for real programmable hardware.

## Manual device provisioning flow

### Login as admin

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "your-admin-email@example.com",
  "password": "your-admin-password"
}
```

Save the returned `accessToken`.

### Create a field-test device

```http
POST /api/v1/devices
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "deviceName": "Field Test Tracker",
  "deviceId": "FIELD-TEST-001",
  "type": "TRACKER",
  "status": "OFFLINE",
  "notes": "Field test device"
}
```

### Generate the device API key

Use the Mongo device id returned by the create or list-devices response:

```http
POST /api/v1/devices/<mongoDeviceId>/api-key
Authorization: Bearer <accessToken>
```

Example success response:

```json
{
  "success": true,
  "message": "Device API key generated successfully. Store it now because it will not be shown again.",
  "device": {
    "id": "681391f83f1a4c6a3f8d22f1",
    "deviceId": "FIELD-TEST-001",
    "deviceName": "Field Test Tracker",
    "deviceApiKeyLastFour": "0c5f",
    "deviceApiKeyIssuedAt": "2026-05-01T14:05:00.000Z",
    "hasDeviceApiKey": true
  },
  "deviceApiKey": "gpsdk_..."
}
```

Store `deviceApiKey` safely. It is shown only once.

## Manual device-ingest flow

### Send a normal sample as a device

```http
POST /api/v1/gps/device-data
X-Device-ID: FIELD-TEST-001
X-Device-Key: <deviceApiKey>
Content-Type: application/json

{
  "latitude": 24.8607,
  "longitude": 67.0011,
  "speed": 18,
  "accuracy": 6,
  "heading": 18,
  "timestamp": "2026-05-01T12:00:00.000Z"
}
```

Expected:

- device appears on live map
- route trail starts building
- no spoofing alert

### Send a spoofing-like sample

```http
POST /api/v1/gps/device-data
X-Device-ID: FIELD-TEST-001
X-Device-Key: <deviceApiKey>
Content-Type: application/json

{
  "latitude": 24.9418,
  "longitude": 67.1541,
  "speed": 420,
  "accuracy": 8,
  "heading": 64,
  "timestamp": "2026-05-01T12:01:10.000Z"
}
```

Expected:

- `detection.detected = true`
- high risk score
- alert saved in MongoDB
- dashboard refresh event emitted
- alert visible in alerts page

## What to verify in the UI

After the test session:

1. Login to the dashboard
2. Open Live Monitoring
3. Confirm the device marker appears
4. Confirm the route trail updates
5. Confirm normal points stay green
6. Confirm spoofing-related points turn red
7. Open Alerts
8. Confirm the new alert appears
9. Check findings, severity, and risk score
10. Export a report if you want final screenshots for delivery

## Real field-test checklist

Use this with a phone hotspot and a real ESP32 or laptop sender:

1. Register one dedicated device ID
2. Generate one dedicated device API key
3. Send 3 to 5 normal movement points
4. Confirm no false alert appears
5. Send one impossible jump
6. Confirm alert generation
7. Send repeated identical coordinates
8. Confirm repeated-coordinate detection
9. Send one large accuracy spike like `accuracy: 180`
10. Confirm anomaly detection and red highlighting

## When a commercial GPS tracker will work directly

Ask these 4 questions:

1. Can it send HTTP or HTTPS requests?
2. Can it send JSON payloads?
3. Can it attach custom headers like `X-Device-ID` and `X-Device-Key`?
4. Can it map its own fields into your API format?

If all 4 are yes, it can likely integrate directly now.

If not, use a vendor gateway.

## Recommended device architecture

```text
Human dashboard users -> JWT auth
Programmable devices -> per-device API key auth
Vendor trackers -> protocol gateway -> device-data route
```

## ESP32 starter files

Use these next:

- `hardware/esp32-gps-client/esp32_gps_client.ino`
- `hardware/esp32-gps-client/README.md`

That example is ready for your first bench test and first outdoor field test.
