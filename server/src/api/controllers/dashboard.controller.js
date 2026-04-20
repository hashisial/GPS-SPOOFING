import { StatusCodes } from "../../utils/vendor.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getDashboardOverview } from "../../services/dashboard/dashboard.service.js";

export const getDashboardOverviewHandler = asyncHandler(async (_req, res) => {
  const overview = await getDashboardOverview();

  res.status(StatusCodes.OK).json({
    success: true,
    overview
  });
});

