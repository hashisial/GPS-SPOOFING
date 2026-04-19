import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getProfile, updateProfile } from "../../services/profile/profile.service.js";

export const getProfileHandler = asyncHandler(async (req, res) => {
  const user = await getProfile(req.user.id);

  res.status(StatusCodes.OK).json({
    success: true,
    user
  });
});

export const updateProfileHandler = asyncHandler(async (req, res) => {
  const user = await updateProfile(req.user.id, req.body);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Profile updated successfully",
    user
  });
});
