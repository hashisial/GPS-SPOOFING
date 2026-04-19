import { Router } from "express";
import { patchUser, postUser, getUsers } from "../controllers/user.controller.js";
import { Roles } from "../constants/roles.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validateRequest } from "../validation/request-validator.js";
import { userSchemas } from "../validation/schemas.js";

const router = Router();

router.use(authenticate, authorize(Roles.ADMIN));
router.get("/", validateRequest(userSchemas.list), getUsers);
router.post("/", validateRequest(userSchemas.create), postUser);
router.patch("/:id", validateRequest(userSchemas.update), patchUser);

export default router;

