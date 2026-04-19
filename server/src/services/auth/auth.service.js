import { randomUUID } from "node:crypto";
import { StatusCodes } from "http-status-codes";
import { logger } from "../../config/logger.js";
import {
  PASSWORD_RESET_TOKEN_TTL_MS,
  TOKEN_TYPES
} from "../../constants/auth.js";
import { ROLES } from "../../constants/roles.js";
import { RefreshTokenModel } from "../../models/RefreshToken.js";
import { UserModel } from "../../models/User.js";
import { ApiError } from "../../utils/ApiError.js";
import { generateRandomToken, hashToken } from "../../utils/crypto.js";
import {
  decodeToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../../utils/jwt.js";
import { env } from "../../config/env.js";
import { sendPasswordResetEmail } from "../notifications/email.service.js";

function sanitizeUser(user) {
  return typeof user.toObject === "function" ? user.toObject() : user;
}

function getExpiryDateFromToken(token) {
  const decoded = decodeToken(token);

  if (!decoded?.exp) {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  return new Date(decoded.exp * 1000);
}

async function persistRefreshToken(user, refreshToken, metadata = {}) {
  const decoded = decodeToken(refreshToken);

  if (!decoded?.sessionId) {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  const document = await RefreshTokenModel.create({
    user: user.id,
    sessionId: decoded.sessionId,
    tokenHash: hashToken(refreshToken),
    expiresAt: getExpiryDateFromToken(refreshToken),
    createdByIp: metadata.ip ?? null,
    userAgent: metadata.userAgent ?? null
  });

  return document;
}

async function issueAuthTokens(user, metadata = {}) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, randomUUID());

  await persistRefreshToken(user, refreshToken, metadata);

  return {
    accessToken,
    refreshToken
  };
}

async function revokeRefreshTokenDocument(tokenDocument, reason, replacedBySessionId = null) {
  tokenDocument.revokedAt = new Date();
  tokenDocument.revokedReason = reason;
  tokenDocument.replacedBySessionId = replacedBySessionId;
  await tokenDocument.save();
}

function getRefreshTokenFromInput(input = {}) {
  return input.refreshToken ?? input.cookieToken ?? null;
}

export async function registerUser(payload, metadata = {}) {
  const existingUser = await UserModel.findOne({
    email: payload.email.toLowerCase()
  });

  if (existingUser) {
    throw ApiError.conflict("A user with this email already exists");
  }

  const userCount = await UserModel.countDocuments();

  if (userCount > 0 && !env.allowPublicRegistration) {
    throw ApiError.forbidden("Self-service registration is disabled");
  }

  let role = ROLES.VIEWER;

  if (userCount === 0) {
    role = payload.role ?? ROLES.SUPER_ADMIN;
  }

  const user = await UserModel.create({
    name: payload.name,
    email: payload.email.toLowerCase(),
    password: payload.password,
    role
  });

  const tokens = await issueAuthTokens(user, metadata);

  return {
    user: sanitizeUser(user),
    ...tokens
  };
}

export async function loginUser(payload, metadata = {}) {
  const user = await UserModel.findOne({
    email: payload.email.toLowerCase()
  }).select("+password");

  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const passwordMatches = await user.comparePassword(payload.password);

  if (!passwordMatches) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (!user.isActive) {
    throw ApiError.forbidden("Your account is disabled");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueAuthTokens(user, metadata);

  return {
    user: sanitizeUser(user),
    ...tokens
  };
}

export async function refreshUserSession(input = {}, metadata = {}) {
  const refreshToken = getRefreshTokenFromInput(input);

  if (!refreshToken) {
    throw ApiError.unauthorized("Refresh token is required");
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  if (payload.type !== TOKEN_TYPES.REFRESH) {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  const tokenDocument = await RefreshTokenModel.findOne({
    tokenHash: hashToken(refreshToken)
  });

  if (!tokenDocument || tokenDocument.revokedAt || tokenDocument.expiresAt <= new Date()) {
    throw ApiError.unauthorized("Refresh token is no longer valid");
  }

  const user = await UserModel.findById(payload.sub);

  if (!user || !user.isActive) {
    throw ApiError.unauthorized("User is not authorized");
  }

  if (user.hasPasswordChangedAfter(payload.iat)) {
    await revokeRefreshTokenDocument(tokenDocument, "password-changed");
    throw ApiError.unauthorized("Refresh token is no longer valid");
  }

  const accessToken = signAccessToken(user);
  const nextRefreshToken = signRefreshToken(user, randomUUID());
  const decodedNextToken = decodeToken(nextRefreshToken);

  await revokeRefreshTokenDocument(
    tokenDocument,
    "rotated",
    decodedNextToken?.sessionId ?? null
  );

  await persistRefreshToken(user, nextRefreshToken, metadata);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken: nextRefreshToken
  };
}

export async function logoutUser(input = {}) {
  const refreshToken = getRefreshTokenFromInput(input);

  if (!refreshToken) {
    return {
      success: true
    };
  }

  const tokenDocument = await RefreshTokenModel.findOne({
    tokenHash: hashToken(refreshToken)
  });

  if (tokenDocument && !tokenDocument.revokedAt) {
    await revokeRefreshTokenDocument(tokenDocument, "logout");
  }

  return {
    success: true
  };
}

export async function forgotPassword(payload) {
  const user = await UserModel.findOne({
    email: payload.email.toLowerCase()
  }).select("+passwordResetTokenHash +passwordResetExpiresAt");

  if (!user) {
    return {
      success: true
    };
  }

  const resetToken = generateRandomToken();
  const resetTokenHash = hashToken(resetToken);
  const resetExpiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

  user.passwordResetTokenHash = resetTokenHash;
  user.passwordResetExpiresAt = resetExpiresAt;
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${env.resetPasswordUrl}?token=${resetToken}`;

  await sendPasswordResetEmail({
    user,
    resetUrl
  });

  logger.info(
    {
      userId: user.id,
      email: user.email,
      resetUrl
    },
    "Password reset token generated"
  );

  return {
    success: true,
    ...(env.isDevelopment
      ? {
          resetToken,
          resetUrl
        }
      : {})
  };
}

export async function resetPassword(payload, metadata = {}) {
  const resetTokenHash = hashToken(payload.token);

  const user = await UserModel.findOne({
    passwordResetTokenHash: resetTokenHash,
    passwordResetExpiresAt: {
      $gt: new Date()
    }
  }).select("+passwordResetTokenHash +passwordResetExpiresAt");

  if (!user) {
    throw ApiError.badRequest("Reset token is invalid or expired");
  }

  user.password = payload.password;
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  user.passwordChangedAt = new Date();
  await user.save();

  await RefreshTokenModel.updateMany(
    {
      user: user.id,
      revokedAt: null
    },
    {
      $set: {
        revokedAt: new Date(),
        revokedReason: "password-reset"
      }
    }
  );

  const tokens = await issueAuthTokens(user, metadata);

  return {
    user: sanitizeUser(user),
    ...tokens
  };
}

export async function getCurrentUserProfile(userId) {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return sanitizeUser(user);
}

export async function revokeAllUserRefreshTokens(userId, reason = "admin-action") {
  await RefreshTokenModel.updateMany(
    {
      user: userId,
      revokedAt: null
    },
    {
      $set: {
        revokedAt: new Date(),
        revokedReason: reason
      }
    }
  );
}
