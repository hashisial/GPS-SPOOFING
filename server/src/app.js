import { compression } from "./utils/vendor.js";
import { cookieParser } from "./utils/vendor.js";
import { cors } from "./utils/vendor.js";
import { express } from "./utils/vendor.js";
import { helmet } from "./utils/vendor.js";
import { pinoHttp } from "./utils/vendor.js";
import { randomUUID } from "node:crypto";
import { apiRouter } from "./api/routes/index.routes.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/notFound.middleware.js";
import { globalRateLimiter } from "./middlewares/rate-limit.middleware.js";
import { sanitizeRequestMiddleware } from "./middlewares/sanitize.middleware.js";

const app = express();

const requestLogger = pinoHttp({
  logger,
  genReqId(req, res) {
    const existingRequestId = req.headers["x-request-id"];
    const requestId =
      typeof existingRequestId === "string" && existingRequestId.trim()
        ? existingRequestId
        : randomUUID();

    res.setHeader("x-request-id", requestId);
    return requestId;
  },
  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} completed with ${res.statusCode}`;
  },
  customErrorMessage(req, res) {
    return `${req.method} ${req.url} failed with ${res.statusCode}`;
  }
});

function resolveCorsOrigin(origin, callback) {
  if (!origin) {
    callback(null, true);
    return;
  }

  if (env.clientUrls.includes(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error("Origin not allowed by CORS"));
}

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(requestLogger);
app.use(
  cors({
    origin: resolveCorsOrigin,
    credentials: true
  })
);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    },
    hsts: env.isProduction
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        }
      : false,
    referrerPolicy: {
      policy: "no-referrer"
    }
  })
);
app.use(globalRateLimiter);
app.use(compression());
app.use(express.json({ limit: env.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: env.bodyLimit }));
app.use(cookieParser());
app.use(sanitizeRequestMiddleware);

app.get("/", (_req, res) => {
  res.status(200).json({
    service: "gps-spoofing-detection-server",
    status: "running"
  });
});

app.use(env.apiPrefix, apiRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export { app };






