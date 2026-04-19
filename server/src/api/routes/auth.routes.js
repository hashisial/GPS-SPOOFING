import { Router } from "express";
import {
  forgotPasswordHandler,
  login,
  logout,
  me,
  refreshToken,
  register,
  resetPasswordHandler
} from "../controllers/auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema
} from "../validators/auth.schemas.js";

export const authRouter = Router();

authRouter.use(authRateLimiter);

authRouter.post("/register", validateRequest(registerSchema), register);
authRouter.post("/login", validateRequest(loginSchema), login);
authRouter.post("/refresh-token", validateRequest(refreshTokenSchema), refreshToken);
authRouter.post("/logout", validateRequest(logoutSchema), logout);
authRouter.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  forgotPasswordHandler
);
authRouter.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  resetPasswordHandler
);
authRouter.get("/me", authenticate, me);
