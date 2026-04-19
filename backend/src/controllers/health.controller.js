import prisma from "../config/db.js";
import { asyncHandler } from "../utils/async-handler.js";

export const getHealth = asyncHandler(async (req, res) => {
  void req;

  let database = "up";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "down";
  }

  return res.status(200).json({
    service: "gps-spoofing-backend",
    status: "ok",
    database,
    timestamp: new Date().toISOString()
  });
});

