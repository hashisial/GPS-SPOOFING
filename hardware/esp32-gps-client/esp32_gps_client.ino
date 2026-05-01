#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <TinyGPS++.h>

static const char* WIFI_SSID = "YOUR_WIFI_NAME";
static const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
static const char* GPS_API_URL = "https://gps-spoofing.onrender.com/api/v1/gps/device-data";
static const char* DEVICE_ID = "FIELD-TEST-001";
// Keep your live device key local on your machine and do not commit it.
static const char* DEVICE_API_KEY = "REPLACE_WITH_DEVICE_API_KEY";

static constexpr bool USE_SIMULATED_GPS = true;
static constexpr unsigned long SEND_INTERVAL_MS = 5000;
static constexpr int GPS_RX_PIN = 16;
static constexpr int GPS_TX_PIN = 17;
static constexpr uint32_t GPS_BAUD = 9600;
static constexpr float DEFAULT_ACCURACY_METERS = 6.0f;

TinyGPSPlus gps;
HardwareSerial gpsSerial(1);
WiFiClientSecure secureClient;

struct GpsSample {
  double latitude;
  double longitude;
  double speedKmh;
  double accuracy;
  double heading;
};

const GpsSample SIMULATED_PATH[] = {
  {24.8607, 67.0011, 16.0, 6.0, 18.0},
  {24.8611, 67.0017, 19.0, 6.0, 22.0},
  {24.8616, 67.0023, 22.0, 7.0, 25.0},
  {24.8621, 67.0029, 21.0, 7.0, 28.0}
};

size_t simulatedIndex = 0;
unsigned long lastSendAt = 0;

String isoTimestampNow() {
  time_t now = time(nullptr);

  if (now < 100000) {
    return "";
  }

  struct tm timeInfo;
  gmtime_r(&now, &timeInfo);

  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeInfo);
  return String(buffer);
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Wi-Fi connected. IP: ");
  Serial.println(WiFi.localIP());
}

void syncClock() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("Syncing time");

  while (isoTimestampNow().isEmpty()) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("Clock synced: ");
  Serial.println(isoTimestampNow());
}

bool readRealGpsSample(GpsSample& sample) {
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }

  if (!gps.location.isValid()) {
    return false;
  }

  sample.latitude = gps.location.lat();
  sample.longitude = gps.location.lng();
  sample.speedKmh = gps.speed.isValid() ? gps.speed.kmph() : 0.0;
  sample.heading = gps.course.isValid() ? gps.course.deg() : 0.0;
  sample.accuracy = DEFAULT_ACCURACY_METERS;

  return true;
}

bool getNextSample(GpsSample& sample) {
  if (USE_SIMULATED_GPS) {
    sample = SIMULATED_PATH[simulatedIndex];
    simulatedIndex = (simulatedIndex + 1) % (sizeof(SIMULATED_PATH) / sizeof(SIMULATED_PATH[0]));
    return true;
  }

  return readRealGpsSample(sample);
}

bool postGpsSample(const GpsSample& sample) {
  String timestamp = isoTimestampNow();

  if (timestamp.isEmpty()) {
    Serial.println("Skipping send because the device clock is not synced yet.");
    return false;
  }

  char payload[320];
  snprintf(
    payload,
    sizeof(payload),
    "{\"deviceId\":\"%s\",\"latitude\":%.6f,\"longitude\":%.6f,\"speed\":%.2f,\"accuracy\":%.2f,\"heading\":%.2f,\"timestamp\":\"%s\"}",
    DEVICE_ID,
    sample.latitude,
    sample.longitude,
    sample.speedKmh,
    sample.accuracy,
    sample.heading,
    timestamp.c_str()
  );

  secureClient.setInsecure();

  HTTPClient http;
  if (!http.begin(secureClient, GPS_API_URL)) {
    Serial.println("Failed to start HTTPS request.");
    return false;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-ID", DEVICE_ID);
  http.addHeader("X-Device-Key", DEVICE_API_KEY);

  int statusCode = http.POST(reinterpret_cast<const uint8_t*>(payload), strlen(payload));
  String responseBody = http.getString();
  http.end();

  Serial.print("POST status: ");
  Serial.println(statusCode);
  Serial.print("Response: ");
  Serial.println(responseBody);

  return statusCode >= 200 && statusCode < 300;
}

void setup() {
  Serial.begin(115200);
  delay(300);

  Serial.println();
  Serial.println("ESP32 GPS client starting...");

  connectWiFi();
  syncClock();

  if (!USE_SIMULATED_GPS) {
    gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
    Serial.println("GPS serial initialized.");
  } else {
    Serial.println("Simulation mode enabled.");
  }
}

void loop() {
  unsigned long now = millis();

  if (now - lastSendAt < SEND_INTERVAL_MS) {
    if (!USE_SIMULATED_GPS) {
      while (gpsSerial.available()) {
        gps.encode(gpsSerial.read());
      }
    }
    delay(20);
    return;
  }

  GpsSample sample;
  if (!getNextSample(sample)) {
    Serial.println("Waiting for a valid GPS fix...");
    delay(500);
    return;
  }

  Serial.print("Sending sample: ");
  Serial.print(sample.latitude, 6);
  Serial.print(", ");
  Serial.print(sample.longitude, 6);
  Serial.print(" speed=");
  Serial.print(sample.speedKmh, 2);
  Serial.print(" heading=");
  Serial.println(sample.heading, 2);

  postGpsSample(sample);
  lastSendAt = now;
}
