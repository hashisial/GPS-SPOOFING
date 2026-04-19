import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import {
  getProfileHandler,
  updateProfileHandler
} from "../controllers/profile.controller.js";
import { updateProfileSchema } from "../validators/profile.schemas.js";

export const profileRouter = Router();

profileRouter.use(authenticate);
profileRouter.get("/", getProfileHandler);
profileRouter.patch("/", validateRequest(updateProfileSchema), updateProfileHandler);
