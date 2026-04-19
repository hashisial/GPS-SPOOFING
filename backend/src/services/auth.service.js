import bcrypt from "bcryptjs";
import prisma from "../config/db.js";
import { Roles } from "../constants/roles.js";
import { createHttpError } from "../utils/http-error.js";
import {
  authenticateDemoUser,
  findDemoUserById,
  isDatabaseUnavailableError,
  serializeDemoUser
} from "../utils/demo-auth.js";
import { signToken } from "../utils/jwt.js";
import { logger } from "../utils/logger.js";

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt
  };
}

function buildAuthResponse(user) {
  return {
    token: signToken({
      sub: user.id,
      email: user.email,
      role: user.role
    }),
    user: serializeUser(user)
  };
}

export async function registerUser(payload) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email }
    });

    if (existingUser) {
      throw createHttpError(409, "An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);

    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        passwordHash,
        role: Roles.USER
      }
    });

    logger.info("user_registered", {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return buildAuthResponse(user);
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      throw createHttpError(
        503,
        "Registration is unavailable while the development database is offline."
      );
    }

    throw error;
  }
}

export async function loginUser(payload) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: payload.email }
    });

    if (!user) {
      throw createHttpError(401, "Invalid credentials.");
    }

    if (!user.isActive) {
      throw createHttpError(403, "This account has been deactivated.");
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.passwordHash);

    if (!isPasswordValid) {
      throw createHttpError(401, "Invalid credentials.");
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        lastLoginAt: new Date()
      }
    });

    logger.info("user_logged_in", {
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role
    });

    return buildAuthResponse(updatedUser);
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    const demoUser = authenticateDemoUser(payload.email, payload.password);

    if (!demoUser) {
      throw createHttpError(401, "Invalid credentials.");
    }

    logger.warn("user_logged_in_demo_mode", {
      userId: demoUser.id,
      email: demoUser.email,
      role: demoUser.role
    });

    return buildAuthResponse(serializeDemoUser(demoUser));
  }
}

export async function getUserProfile(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw createHttpError(404, "User not found.");
    }

    return {
      user: serializeUser(user)
    };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    const demoUser = findDemoUserById(userId);

    if (!demoUser) {
      throw createHttpError(404, "User not found.");
    }

    return {
      user: serializeDemoUser(demoUser)
    };
  }
}
