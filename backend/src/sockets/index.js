import { Server } from "socket.io";
import prisma from "../config/db.js";
import env from "../config/env.js";
import { verifyToken } from "../utils/jwt.js";
import { logger } from "../utils/logger.js";

export function initializeSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: env.corsOrigins,
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Socket authentication required."));
    }

    try {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
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

      if (!user || !user.isActive) {
        return next(new Error("Socket session is no longer valid."));
      }

      socket.user = {
        sub: user.id,
        email: user.email,
        role: user.role
      };

      return next();
    } catch {
      return next(new Error("Invalid socket token."));
    }
  });

  io.on("connection", (socket) => {
    socket.join("gps-ops");

    logger.info("socket_connected", {
      userId: socket.user.sub,
      socketId: socket.id
    });

    socket.emit("connection:ready", {
      message: "Realtime GPS alert channel established.",
      role: socket.user.role
    });
  });

  return io;
}

export function emitAlertCreated(io, alert) {
  if (!io) {
    return;
  }

  io.to("gps-ops").emit("alert:created", alert);
}

export function emitGpsUpdated(io, payload) {
  if (!io) {
    return;
  }

  io.to("gps-ops").emit("gps:updated", payload);
}
