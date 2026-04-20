import { Router } from "../../utils/vendor.js";
import { getLiveGpsHandler, ingestGpsDataHandler } from "../controllers/gps.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { ROLES } from "../../constants/roles.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { ingestGpsDataSchema, listLiveGpsSchema } from "../validators/gps.schemas.js";

export const gpsRouter = Router();

gpsRouter.get(
  "/live",
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.SECURITY_ANALYST, ROLES.VIEWER),
  validateRequest(listLiveGpsSchema),
  getLiveGpsHandler
);
gpsRouter.post(
  "/data",
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.SECURITY_ANALYST),
  validateRequest(ingestGpsDataSchema),
  ingestGpsDataHandler
);

