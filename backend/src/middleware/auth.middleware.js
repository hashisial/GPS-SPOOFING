import prisma from "../config/db.js";
import {
  findDemoUserById,
  isDatabaseUnavailableError
} from "../utils/demo-auth.js";
import { verifyToken } from "../utils/jwt.js";

export async function authenticate(req, res, next) {
  const authorizationHeader = req.headers.authorization ?? "";

  if (!authorizationHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required."
    });
  }

  const token = authorizationHeader.replace("Bearer ", "").trim();

  try {
    const decoded = verifyToken(token);
    let user;

    try {
      user = await prisma.user.findUnique({
        where: {
          id: decoded.sub
        },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true
        }
      });
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) {
        throw error;
      }

      user = findDemoUserById(decoded.sub);
    }

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "This session is no longer valid."
      });
    }

    req.user = {
      sub: user.id,
      email: user.email,
      role: user.role
    };
    return next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token."
    });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You are not authorized to access this resource."
      });
    }

    return next();
  };
}
