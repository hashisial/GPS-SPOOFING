import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import env from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import { apiRateLimiter } from "./middleware/rate-limit.middleware.js";
import apiRoutes from "./routes/index.js";
import { logger } from "./utils/logger.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);
app.use(
  morgan("combined", {
    stream: {
      write(message) {
        logger.http("incoming_request", {
          request: message.trim()
        });
      }
    }
  })
);
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));
app.use("/api/v1", apiRateLimiter);

app.get("/", (req, res) => {
  void req;
  return res.json({
    service: "gps-spoofing-backend",
    version: "1.0.0",
    docs: "/api/v1/health"
  });
});

app.use("/api/v1", apiRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
