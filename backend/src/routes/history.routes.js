import { Router } from "express";
import { getHistory } from "../controllers/gps.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateRequest } from "../validation/request-validator.js";
import { historySchemas } from "../validation/schemas.js";

const router = Router();

router.use(authenticate);
router.get("/", validateRequest(historySchemas.list), getHistory);

export default router;

