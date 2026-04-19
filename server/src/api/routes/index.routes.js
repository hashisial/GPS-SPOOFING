import { Router } from "express";
import { alertRouter } from "./alert.routes.js";
import { authRouter } from "./auth.routes.js";
import { dashboardRouter } from "./dashboard.routes.js";
import { deviceRouter } from "./device.routes.js";
import { gpsRouter } from "./gps.routes.js";
import { profileRouter } from "./profile.routes.js";
import { reportRouter } from "./report.routes.js";
import { settingsRouter } from "./settings.routes.js";
import { userRouter } from "./user.routes.js";
import { healthController } from "../controllers/health.controller.js";

export const apiRouter = Router();

apiRouter.use("/alerts", alertRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/devices", deviceRouter);
apiRouter.use("/gps", gpsRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/reports", reportRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/users", userRouter);
apiRouter.get("/health", healthController);
