import { Router } from "express";
import { getAlerts } from "../controllers/alert.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateRequest } from "../validation/request-validator.js";
import { alertSchemas } from "../validation/schemas.js";

const router = Router();

router.use(authenticate);
router.get("/", validateRequest(alertSchemas.list), getAlerts);

export default router;

