import { Router } from "../../utils/vendor.js";
import {
  blockUserHandler,
  createUserHandler,
  deleteUserHandler,
  getUserHandler,
  listUsersHandler,
  unblockUserHandler,
  updateUserHandler
} from "../controllers/user.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { ROLES } from "../../constants/roles.js";
import {
  blockUserSchema,
  createUserSchema,
  listUsersSchema,
  updateUserSchema,
  userIdParamSchema
} from "../validators/user.schemas.js";

export const userRouter = Router();

userRouter.use(authenticate, authorize(ROLES.SUPER_ADMIN));

userRouter.get("/", validateRequest(listUsersSchema), listUsersHandler);
userRouter.get("/:userId", validateRequest(userIdParamSchema), getUserHandler);
userRouter.post("/", validateRequest(createUserSchema), createUserHandler);
userRouter.patch("/:userId", validateRequest(updateUserSchema), updateUserHandler);
userRouter.patch(
  "/:userId/block",
  validateRequest(blockUserSchema),
  blockUserHandler
);
userRouter.patch("/:userId/unblock", validateRequest(userIdParamSchema), unblockUserHandler);
userRouter.delete("/:userId", validateRequest(userIdParamSchema), deleteUserHandler);

