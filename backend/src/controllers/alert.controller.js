import { asyncHandler } from "../utils/async-handler.js";
import { listAlerts } from "../services/alert.service.js";

export const getAlerts = asyncHandler(async (req, res) => {
  const alerts = await listAlerts(req.query);

  return res.status(200).json(alerts);
});

