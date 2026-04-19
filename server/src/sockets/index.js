import { Server } from "socket.io";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { UserModel } from "../models/User.js";
import { verifyAccessToken } from "../utils/jwt.js";

let io;

function extractSocketToken(socket) {
  const authToken = socket.handshake.auth?.token;

  if (typeof authToken === "string" && authToken.trim()) {
    return authToken;
  }

  const authorizationHeader = socket.handshake.headers?.authorization;

  if (typeof authorizationHeader === "string" && authorizationHeader.startsWith("Bearer ")) {
    return authorizationHeader.split(" ")[1];
  }

  return null;
}

async function socketAuthMiddleware(socket, next) {
  try {
    const token = extractSocketToken(socket);

    if (!token) {
      next(new Error("Authentication required"));
      return;
    }

    const payload = verifyAccessToken(token);
    const user = await UserModel.findById(payload.sub);

    if (!user || !user.isActive || user.hasPasswordChangedAfter(payload.iat)) {
      next(new Error("User is not authorized"));
      return;
    }

    socket.user = user.toObject();
    next();
  } catch {
    next(new Error("Invalid or expired access token"));
  }
}

export function initializeSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrls,
      credentials: true
    }
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.id}`);
    socket.join(`role:${socket.user.role}`);

    socket.emit("system:connected", {
      success: true,
      userId: socket.user.id,
      connectedAt: new Date().toISOString()
    });

    logger.info(
      {
        socketId: socket.id,
        userId: socket.user.id,
        role: socket.user.role
      },
      "Socket client connected"
    );

    socket.on("disconnect", (reason) => {
      logger.info(
        {
          socketId: socket.id,
          userId: socket.user.id,
          reason
        },
        "Socket client disconnected"
      );
    });
  });

  return io;
}

export function getSocketServer() {
  return io;
}

function safeEmit(eventName, payload) {
  if (!io) {
    return;
  }

  io.emit(eventName, payload);
}

export function emitGpsMovement(payload) {
  safeEmit("gps:movement", payload);
  safeEmit("dashboard:refresh", {
    reason: "gps-movement",
    at: new Date().toISOString()
  });
}

export function emitAlertCreated(alert) {
  safeEmit("alerts:created", alert);
  safeEmit("dashboard:refresh", {
    reason: "alert-created",
    alertId: alert.id,
    at: new Date().toISOString()
  });
}

export function emitAlertUpdated(alert) {
  safeEmit("alerts:updated", alert);
  safeEmit("dashboard:refresh", {
    reason: "alert-updated",
    alertId: alert.id,
    at: new Date().toISOString()
  });
}

export function emitAlertDeleted(payload) {
  safeEmit("alerts:deleted", payload);
  safeEmit("dashboard:refresh", {
    reason: "alert-deleted",
    alertId: payload.id,
    at: new Date().toISOString()
  });
}
