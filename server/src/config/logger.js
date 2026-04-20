import { pino } from "../utils/vendor.js";
import { env } from "./env.js";

export const logger = pino({
  level: env.logLevel,
  base: undefined,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "confirmPassword",
      "token",
      "accessToken",
      "refreshToken"
    ],
    censor: "[REDACTED]"
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

