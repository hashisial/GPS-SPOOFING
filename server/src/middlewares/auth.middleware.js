import { StatusCodes } from "../utils/vendor.js";
import { UserModel } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/jwt.js";

function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.split(" ")[1];
}

function normalizeTokenError(error) {
  if (
    error?.name === "TokenExpiredError" ||
    error?.name === "JsonWebTokenError" ||
    error?.name === "NotBeforeError"
  ) {
    return new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired access token");
  }

  return error;
}

export async function authenticate(req, _res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required"));
    }

    const payload = verifyAccessToken(token);
    const user = await UserModel.findById(payload.sub);

    if (!user || !user.isActive) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, "User is not authorized"));
    }

    if (user.hasPasswordChangedAfter(payload.iat)) {
      return next(
        new ApiError(StatusCodes.UNAUTHORIZED, "Access token is no longer valid")
      );
    }

    req.user = user.toObject();
    req.auth = {
      token,
      payload
    };

    return next();
  } catch (error) {
    return next(normalizeTokenError(error));
  }
}

export function authorize(...allowedRoles) {
  return function roleAuthorizationMiddleware(req, _res, next) {
    if (!req.user) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required"));
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return next(new ApiError(StatusCodes.FORBIDDEN, "Insufficient permissions"));
    }

    return next();
  };
}

