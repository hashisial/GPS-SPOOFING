import { dotenv } from "../utils/vendor.js";
import { z } from "../utils/vendor.js";
import { REFRESH_COOKIE_DEFAULT_NAME } from "../constants/auth.js";

dotenv.config();

const booleanFromEnv = z
  .union([z.boolean(), z.string()])
  .transform((value) => {
    if (typeof value === "boolean") {
      return value;
    }

    return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
  });

function parseOrigins(value) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().min(1).default("http://localhost:5173"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  API_PREFIX: z.string().default("/api/v1"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(200),
  BODY_LIMIT: z.string().default("1mb"),
  GPS_DUPLICATE_WINDOW_MS: z.coerce.number().int().positive().default(10_000),
  DEVICE_ONLINE_WINDOW_MS: z.coerce.number().int().positive().default(300_000),
  DETECTION_JUMP_DISTANCE_METERS: z.coerce.number().positive().default(1_500),
  DETECTION_JUMP_WINDOW_MS: z.coerce.number().int().positive().default(120_000),
  DETECTION_MAX_SPEED_KMH: z.coerce.number().positive().default(280),
  DETECTION_TIMESTAMP_DRIFT_MS: z.coerce.number().int().positive().default(300_000),
  DETECTION_REPEATED_COORDINATES_LIMIT: z.coerce.number().int().min(3).default(4),
  DETECTION_GEOFENCE_ENABLED: booleanFromEnv.default("false"),
  DETECTION_GEOFENCE_CENTER_LAT: z.coerce.number().min(-90).max(90).default(0),
  DETECTION_GEOFENCE_CENTER_LNG: z.coerce.number().min(-180).max(180).default(0),
  DETECTION_GEOFENCE_RADIUS_METERS: z.coerce.number().min(0).default(0),
  DETECTION_ACCURACY_FLUCTUATION_METERS: z.coerce.number().min(0).default(50),
  DETECTION_ACCURACY_FLUCTUATION_RATIO: z.coerce.number().positive().default(3),
  DETECTION_TELEPORT_DISTANCE_METERS: z.coerce.number().positive().default(5_000),
  DETECTION_TELEPORT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),
  REFRESH_COOKIE_NAME: z.string().default(REFRESH_COOKIE_DEFAULT_NAME),
  REFRESH_COOKIE_MAX_AGE_MS: z.coerce.number().int().positive().default(7 * 24 * 60 * 60 * 1000),
  COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).optional(),
  RESET_PASSWORD_URL: z
    .string()
    .url()
    .default("http://localhost:5173/reset-password"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  ALLOW_PUBLIC_REGISTRATION: booleanFromEnv.default("false"),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration: ${message}`);
}

const config = parsed.data;

export const env = {
  nodeEnv: config.NODE_ENV,
  isDevelopment: config.NODE_ENV === "development",
  isProduction: config.NODE_ENV === "production",
  isTest: config.NODE_ENV === "test",
  port: config.PORT,
  clientUrl: parseOrigins(config.CLIENT_URL)[0] ?? "http://localhost:5173",
  clientUrls: parseOrigins(config.CLIENT_URL),
  mongodbUri: config.MONGODB_URI,
  logLevel: config.LOG_LEVEL,
  apiPrefix: config.API_PREFIX,
  rateLimitWindowMs: config.RATE_LIMIT_WINDOW_MS,
  rateLimitMax: config.RATE_LIMIT_MAX,
  bodyLimit: config.BODY_LIMIT,
  gpsDuplicateWindowMs: config.GPS_DUPLICATE_WINDOW_MS,
  deviceOnlineWindowMs: config.DEVICE_ONLINE_WINDOW_MS,
  detectionJumpDistanceMeters: config.DETECTION_JUMP_DISTANCE_METERS,
  detectionJumpWindowMs: config.DETECTION_JUMP_WINDOW_MS,
  detectionMaxSpeedKmh: config.DETECTION_MAX_SPEED_KMH,
  detectionTimestampDriftMs: config.DETECTION_TIMESTAMP_DRIFT_MS,
  detectionRepeatedCoordinatesLimit: config.DETECTION_REPEATED_COORDINATES_LIMIT,
  detectionGeofenceEnabled: config.DETECTION_GEOFENCE_ENABLED,
  detectionGeofenceCenterLat: config.DETECTION_GEOFENCE_CENTER_LAT,
  detectionGeofenceCenterLng: config.DETECTION_GEOFENCE_CENTER_LNG,
  detectionGeofenceRadiusMeters: config.DETECTION_GEOFENCE_RADIUS_METERS,
  detectionAccuracyFluctuationMeters: config.DETECTION_ACCURACY_FLUCTUATION_METERS,
  detectionAccuracyFluctuationRatio: config.DETECTION_ACCURACY_FLUCTUATION_RATIO,
  detectionTeleportDistanceMeters: config.DETECTION_TELEPORT_DISTANCE_METERS,
  detectionTeleportWindowMs: config.DETECTION_TELEPORT_WINDOW_MS,
  bcryptSaltRounds: config.BCRYPT_SALT_ROUNDS,
  refreshCookieName: config.REFRESH_COOKIE_NAME,
  refreshCookieMaxAgeMs: config.REFRESH_COOKIE_MAX_AGE_MS,
  cookieSameSite:
    config.COOKIE_SAME_SITE ?? (config.NODE_ENV === "production" ? "none" : "lax"),
  resetPasswordUrl: config.RESET_PASSWORD_URL,
  resendApiKey: config.RESEND_API_KEY ?? "",
  emailFrom: config.EMAIL_FROM ?? "",
  allowPublicRegistration: config.ALLOW_PUBLIC_REGISTRATION,
  jwtAccessSecret: config.JWT_ACCESS_SECRET,
  jwtRefreshSecret: config.JWT_REFRESH_SECRET,
  jwtAccessTtl: config.JWT_ACCESS_TTL,
  jwtRefreshTtl: config.JWT_REFRESH_TTL
};


