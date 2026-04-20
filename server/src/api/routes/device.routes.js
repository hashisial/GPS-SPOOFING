import { Router } from "../../utils/vendor.js";
import {
  createDeviceHandler,
  deleteDeviceHandler,
  getDeviceHandler,
  listDevicesHandler,
  updateDeviceHandler
} from "../controllers/device.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { ROLES } from "../../constants/roles.js";
import {
  createDeviceSchema,
  deviceIdParamSchema,
  listDevicesSchema,
  updateDeviceSchema
} from "../validators/device.schemas.js";

export const deviceRouter = Router();

deviceRouter.use(authenticate);

deviceRouter.get(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.SECURITY_ANALYST, ROLES.VIEWER),
  validateRequest(listDevicesSchema),
  listDevicesHandler
);
deviceRouter.get(
  "/:deviceId",
  authorize(ROLES.SUPER_ADMIN, ROLES.SECURITY_ANALYST, ROLES.VIEWER),
  validateRequest(deviceIdParamSchema),
  getDeviceHandler
);
deviceRouter.post(
  "/",
  authorize(ROLES.SUPER_ADMIN),
  validateRequest(createDeviceSchema),
  createDeviceHandler
);
deviceRouter.patch(
  "/:deviceId",
  authorize(ROLES.SUPER_ADMIN),
  validateRequest(updateDeviceSchema),
  updateDeviceHandler
);
deviceRouter.delete(
  "/:deviceId",
  authorize(ROLES.SUPER_ADMIN),
  validateRequest(deviceIdParamSchema),
  deleteDeviceHandler
);

