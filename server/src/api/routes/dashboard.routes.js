import { Router } from "express";
import { getDashboardOverviewHandler } from "../controllers/dashboard.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);
dashboardRouter.get("/overview", getDashboardOverviewHandler);
