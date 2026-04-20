import { Router } from "../../utils/vendor.js";
import {
  deleteAlertHandler,
  escalateAlertHandler,
  falsePositiveAlertHandler,
  getAlertHandler,
  listAlertsHandler,
  resolveAlertHandler
} from "../controllers/alert.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { ROLES } from "../../constants/roles.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import {
  alertIdParamSchema,
  escalateAlertSchema,
  falsePositiveAlertSchema,
  listAlertsSchema,
  resolveAlertSchema
} from "../validators/alert.schemas.js";

export const alertRouter = Router();

alertRouter.use(authenticate);

alertRouter.get(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.SECURITY_ANALYST, ROLES.VIEWER),
  validateRequest(listAlertsSchema),
  listAlertsHandler
);
alertRouter.get(
  "/:alertId",
  authorize(ROLES.SUPER_ADMIN, ROLES.SECURITY_ANALYST, ROLES.VIEWER),
  validateRequest(alertIdParamSchema),
  getAlertHandler
);
alertRouter.patch(
  "/:alertId/resolve",
  authorize(ROLES.SUPER_ADMIN, ROLES.SECURITY_ANALYST),
  validateRequest(resolveAlertSchema),
  resolveAlertHandler
);
alertRouter.patch(
  "/:alertId/false-positive",
  authorize(ROLES.SUPER_ADMIN, ROLES.SECURITY_ANALYST),
  validateRequest(falsePositiveAlertSchema),
  falsePositiveAlertHandler
);
alertRouter.patch(
  "/:alertId/escalate",
  authorize(ROLES.SUPER_ADMIN, ROLES.SECURITY_ANALYST),
  validateRequest(escalateAlertSchema),
  escalateAlertHandler
);
alertRouter.delete(
  "/:alertId",
  authorize(ROLES.SUPER_ADMIN),
  validateRequest(alertIdParamSchema),
  deleteAlertHandler
);

