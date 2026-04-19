import { Router } from "express";
import alertRoutes from "./alert.routes.js";
import authRoutes from "./auth.routes.js";
import deviceRoutes from "./device.routes.js";
import gpsRoutes from "./gps.routes.js";
import healthRoutes from "./health.routes.js";
import historyRoutes from "./history.routes.js";
import reportRoutes from "./report.routes.js";
import settingsRoutes from "./settings.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/gps", gpsRoutes);
router.use("/alerts", alertRoutes);
router.use("/history", historyRoutes);
router.use("/reports", reportRoutes);
router.use("/users", userRoutes);
router.use("/devices", deviceRoutes);
router.use("/settings", settingsRoutes);

export default router;
