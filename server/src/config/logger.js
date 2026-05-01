import { pino } from "../utils/vendor.js";
import { env } from "./env.js";

export const logger = pino({
  level: env.logLevel,
  base: undefined,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers.x-api-key",
      "req.headers.x-device-key",
      "password",
      "confirmPassword",
      "token",
      "apiKey",
      "deviceApiKey",
      "accessToken",
      "refreshToken"
    ],
    censor: "[REDACTED]"
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

