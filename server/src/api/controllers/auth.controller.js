import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getRefreshCookieOptions,
  refreshCookieName
} from "../../utils/cookies.js";
import {
  forgotPassword,
  getCurrentUserProfile,
  loginUser,
  logoutUser,
  refreshUserSession,
  registerUser,
  resetPassword
} from "../../services/auth/auth.service.js";

function buildRequestMetadata(req) {
  return {
    ip: req.ip,
    userAgent: req.get("user-agent")
  };
}

function setRefreshTokenCookie(res, refreshToken) {
  res.cookie(refreshCookieName, refreshToken, getRefreshCookieOptions());
}

function clearRefreshTokenCookie(res) {
  res.clearCookie(refreshCookieName, getRefreshCookieOptions());
}

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body, buildRequestMetadata(req));

  setRefreshTokenCookie(res, result.refreshToken);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "User registered successfully",
    ...result
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body, buildRequestMetadata(req));

  setRefreshTokenCookie(res, result.refreshToken);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Login successful",
    ...result
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const result = await refreshUserSession(
    {
      refreshToken: req.body.refreshToken,
      cookieToken: req.cookies?.[refreshCookieName]
    },
    buildRequestMetadata(req)
  );

  setRefreshTokenCookie(res, result.refreshToken);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Session refreshed successfully",
    ...result
  });
});

export const logout = asyncHandler(async (req, res) => {
  await logoutUser({
    refreshToken: req.body.refreshToken,
    cookieToken: req.cookies?.[refreshCookieName]
  });

  clearRefreshTokenCookie(res);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Logout successful"
  });
});

export const forgotPasswordHandler = asyncHandler(async (req, res) => {
  const result = await forgotPassword(req.body);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "If the email exists, a password reset flow has been initiated",
    ...result
  });
});

export const resetPasswordHandler = asyncHandler(async (req, res) => {
  const result = await resetPassword(req.body, buildRequestMetadata(req));

  setRefreshTokenCookie(res, result.refreshToken);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Password reset successful",
    ...result
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUserProfile(req.user.id);

  res.status(StatusCodes.OK).json({
    success: true,
    user
  });
});
