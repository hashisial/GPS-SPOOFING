import { Router } from "express";
import { login, me, register } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authRateLimiter } from "../middleware/rate-limit.middleware.js";
import { validateRequest } from "../validation/request-validator.js";
import { authSchemas } from "../validation/schemas.js";

const router = Router();

router.post("/register", authRateLimiter, validateRequest(authSchemas.register), register);
router.post("/login", authRateLimiter, validateRequest(authSchemas.login), login);
router.get("/me", authenticate, me);

export default router;
