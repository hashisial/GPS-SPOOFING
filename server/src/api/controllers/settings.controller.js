import { StatusCodes } from "../../utils/vendor.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getSettings, updateSettings } from "../../services/settings/settings.service.js";

export const getSettingsHandler = asyncHandler(async (req, res) => {
  const settings = await getSettings(req.user.id);

  res.status(StatusCodes.OK).json({
    success: true,
    settings
  });
});

export const updateSettingsHandler = asyncHandler(async (req, res) => {
  const settings = await updateSettings(req.user.id, req.user, req.body);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Settings updated successfully",
    settings
  });
});

