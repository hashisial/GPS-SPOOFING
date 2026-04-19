import { Router } from "express";
import {
  getDetections,
  getSummary,
  patchDetectionStatus,
  postDetection
} from "../controllers/detection.controller.js";
import { Roles } from "../constants/roles.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validateRequest } from "../validation/request-validator.js";
import { detectionSchemas } from "../validation/schemas.js";

const router = Router();

router.use(authenticate);
router.get("/", validateRequest(detectionSchemas.list), getDetections);
router.get("/summary", getSummary);
router.post(
  "/",
  authorize(Roles.ADMIN),
  validateRequest(detectionSchemas.create),
  postDetection
);
router.patch(
  "/:id/status",
  authorize(Roles.ADMIN),
  validateRequest(detectionSchemas.updateStatus),
  patchDetectionStatus
);

export default router;
