import { asyncHandler } from "../utils/async-handler.js";
import { getUserProfile, loginUser, registerUser } from "../services/auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const response = await registerUser(req.body);

  return res.status(201).json(response);
});

export const login = asyncHandler(async (req, res) => {
  const response = await loginUser(req.body);

  return res.status(200).json(response);
});

export const me = asyncHandler(async (req, res) => {
  const response = await getUserProfile(req.user.sub);

  return res.status(200).json(response);
});

