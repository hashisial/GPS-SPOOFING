import { Router } from "express";
import { postGpsData, getGpsLive } from "../controllers/gps.controller.js";
import { Roles } from "../constants/roles.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validateRequest } from "../validation/request-validator.js";
import { gpsSchemas } from "../validation/schemas.js";

const router = Router();

router.use(authenticate);
router.post("/data", authorize(Roles.ADMIN), validateRequest(gpsSchemas.ingest), postGpsData);
router.get("/live", validateRequest(gpsSchemas.live), getGpsLive);

export default router;

