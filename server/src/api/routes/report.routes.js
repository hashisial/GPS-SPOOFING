import { Router } from "express";
import {
  exportReportHandler,
  generateReportHandler,
  getReportHandler,
  listReportsHandler
} from "../controllers/report.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { ROLES } from "../../constants/roles.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import {
  exportReportSchema,
  generateReportSchema,
  listReportsSchema,
  reportIdParamSchema
} from "../validators/report.schemas.js";

export const reportRouter = Router();

reportRouter.use(authenticate);

reportRouter.post(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.SECURITY_ANALYST),
  validateRequest(generateReportSchema),
  generateReportHandler
);
reportRouter.get(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.SECURITY_ANALYST, ROLES.VIEWER),
  validateRequest(listReportsSchema),
  listReportsHandler
);
reportRouter.get(
  "/:reportId",
  authorize(ROLES.SUPER_ADMIN, ROLES.SECURITY_ANALYST, ROLES.VIEWER),
  validateRequest(reportIdParamSchema),
  getReportHandler
);
reportRouter.get(
  "/:reportId/export",
  authorize(ROLES.SUPER_ADMIN, ROLES.SECURITY_ANALYST, ROLES.VIEWER),
  validateRequest(exportReportSchema),
  exportReportHandler
);
