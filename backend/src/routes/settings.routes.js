import { Router } from "express";
import {
  getNotificationPreferencesController,
  getSystemSettingsController,
  putNotificationPreferencesController,
  putSystemSettingsController
} from "../controllers/settings.controller.js";
import { Roles } from "../constants/roles.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validateRequest } from "../validation/request-validator.js";
import { settingsSchemas } from "../validation/schemas.js";

const router = Router();

router.use(authenticate);
router.get("/system", getSystemSettingsController);
router.put(
  "/system",
  authorize(Roles.ADMIN),
  validateRequest(settingsSchemas.updateSystem),
  putSystemSettingsController
);
router.get("/notifications", getNotificationPreferencesController);
router.put(
  "/notifications",
  validateRequest(settingsSchemas.updateNotifications),
  putNotificationPreferencesController
);

export default router;

