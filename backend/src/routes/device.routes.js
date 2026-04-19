import { Router } from "express";
import { getDevices, patchDevice, postDevice } from "../controllers/device.controller.js";
import { Roles } from "../constants/roles.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validateRequest } from "../validation/request-validator.js";
import { deviceSchemas } from "../validation/schemas.js";

const router = Router();

router.use(authenticate);
router.get("/", validateRequest(deviceSchemas.list), getDevices);
router.post("/", authorize(Roles.ADMIN), validateRequest(deviceSchemas.create), postDevice);
router.patch(
  "/:id",
  authorize(Roles.ADMIN),
  validateRequest(deviceSchemas.update),
  patchDevice
);

export default router;
