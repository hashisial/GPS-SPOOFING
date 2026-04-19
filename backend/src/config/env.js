import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backendEnvPath = path.resolve(currentDir, "../../.env");
const workspaceEnvPath = path.resolve(currentDir, "../../../.env");

dotenv.config({ path: workspaceEnvPath });
dotenv.config({ path: backendEnvPath, override: true });

const fallbackDatabaseUrl =
  "postgresql://postgres:postgres@localhost:5432/gps_dashboard?schema=public";
const fallbackJwtSecret = "replace-this-development-secret-before-production-use";

function parseNumber(value, fallback, { min, max } = {}) {
  const parsed = Number(value ?? fallback);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  if (min !== undefined && parsed < min) {
    return fallback;
  }

  if (max !== undefined && parsed > max) {
    return fallback;
  }

  return parsed;
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const clientUrl = process.env.CLIENT_URL?.trim() || "http://localhost:3000";
const jwtSecret = process.env.JWT_SECRET?.trim() || fallbackJwtSecret;

if (nodeEnv === "production" && jwtSecret === fallbackJwtSecret) {
  throw new Error("A secure JWT_SECRET must be configured in production.");
}

const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: parseNumber(process.env.PORT, 5000, { min: 1 }),
  clientUrl,
  corsOrigins: clientUrl
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),
  databaseUrl: process.env.DATABASE_URL?.trim() || fallbackDatabaseUrl,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || "12h",
  apiRateLimitMax: parseNumber(process.env.API_RATE_LIMIT_MAX, 400, {
    min: 50,
    max: 5000
  }),
  authRateLimitMax: parseNumber(process.env.AUTH_RATE_LIMIT_MAX, 20, {
    min: 5,
    max: 200
  }),
  reportRateLimitMax: parseNumber(process.env.REPORT_RATE_LIMIT_MAX, 60, {
    min: 5,
    max: 200
  })
};

export default env;
