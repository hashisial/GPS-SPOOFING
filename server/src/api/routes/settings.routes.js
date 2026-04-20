import { Router } from "../../utils/vendor.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import {
  getSettingsHandler,
  updateSettingsHandler
} from "../controllers/settings.controller.js";
import { updateSettingsSchema } from "../validators/settings.schemas.js";

export const settingsRouter = Router();

settingsRouter.use(authenticate);
settingsRouter.get("/", getSettingsHandler);
settingsRouter.patch("/", validateRequest(updateSettingsSchema), updateSettingsHandler);

