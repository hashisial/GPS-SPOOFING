import mongoose from "mongoose";

export function healthController(_req, res) {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };

  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      state: states[mongoose.connection.readyState] ?? "unknown"
    }
  });
}
