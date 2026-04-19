import { Router } from "express";
import {
  getReportCsv,
  getReportPdf,
  postReport
} from "../controllers/report.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { reportRateLimiter } from "../middleware/rate-limit.middleware.js";
import { validateRequest } from "../validation/request-validator.js";
import { reportSchemas } from "../validation/schemas.js";

const router = Router();

router.use(authenticate);
router.get(
  "/export.csv",
  reportRateLimiter,
  validateRequest(reportSchemas.export),
  getReportCsv
);
router.get(
  "/export.pdf",
  reportRateLimiter,
  validateRequest(reportSchemas.export),
  getReportPdf
);
router.post("/", reportRateLimiter, validateRequest(reportSchemas.create), postReport);

export default router;
