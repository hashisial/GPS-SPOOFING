# ESP32 GPS Client

This folder contains a ready-to-adapt ESP32 sender for your GPS Spoofing Detection Dashboard.

It targets the new device-auth route:

```text
POST /api/v1/gps/device-data
```

with headers:

```text
X-Device-ID
X-Device-Key
```

## What this sketch gives you

- real HTTPS POST requests from ESP32
- device API key authentication
- real or simulated GPS coordinates
- bench testing without moving hardware
- field testing with a real GPS module

## Recommended test hardware

- ESP32 DevKit
- NEO-6M or NEO-M8N GPS module
- phone hotspot or Wi-Fi access point

For the first test, Wi-Fi is faster and easier than 4G.
After validation, you can move the same payload logic to a `SIM7600` transport layer.

## Wiring

Example ESP32 UART wiring:

- GPS `VCC` -> ESP32 `3V3` or module-rated supply
- GPS `GND` -> ESP32 `GND`
- GPS `TX` -> ESP32 `GPIO16` (`GPS_RX_PIN`)
- GPS `RX` -> ESP32 `GPIO17` (`GPS_TX_PIN`) optional

## Arduino libraries

Install:

- `TinyGPSPlus`

Built-in ESP32 core libraries used:

- `WiFi.h`
- `WiFiClientSecure.h`
- `HTTPClient.h`
- `HardwareSerial.h`

## First setup

1. Open `esp32_gps_client.ino`
2. Set:

```cpp
static const char* WIFI_SSID = "YOUR_WIFI_NAME";
static const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
static const char* GPS_API_URL = "https://gps-spoofing.onrender.com/api/v1/gps/device-data";
static const char* DEVICE_ID = "FIELD-TEST-001";
static const char* DEVICE_API_KEY = "gpsdk_...";
```

3. Keep `USE_SIMULATED_GPS` as `1` for your first bench test
4. Flash the board
5. Open Serial Monitor at `115200`

## Bench test mode

With simulation enabled, the board will:

- connect to Wi-Fi
- sync time with NTP
- send a moving sequence of normal coordinates
- log backend responses to Serial

This is the easiest first proof that hardware-to-cloud communication works.

## Real GPS mode

Change:

```cpp
static constexpr bool USE_SIMULATED_GPS = false;
```

Then place the ESP32 outdoors so the GPS module can lock satellites.

## Production note

The sample sketch uses:

```cpp
client.setInsecure();
```

This is acceptable for a first controlled test.
For production, replace it with proper CA certificate pinning or server certificate validation.

## Expected backend behavior

When the device sends a valid point:

- the GPS log is stored
- the device `lastSeen` is updated
- Socket.io emits movement updates
- the marker appears in live monitoring

When the device sends spoofing-like data:

- the detection engine calculates risk
- an alert is generated if the threshold is crossed
- the alert becomes visible in the dashboard

## Next upgrade after ESP32 Wi-Fi validation

Once this works, the clean production path is:

```text
ESP32 + GNSS + SIM7600 -> /gps/device-data
```

That gives you a real standalone field device.
