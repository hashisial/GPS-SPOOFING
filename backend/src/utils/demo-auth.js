import env from "../config/env.js";
import { Roles } from "../constants/roles.js";

const demoUsers = [
  {
    id: "demo-admin",
    name: "Operations Admin",
    email: "admin@gpsshield.local",
    password: "Admin123!",
    role: Roles.ADMIN,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date("2026-04-18T00:00:00.000Z")
  },
  {
    id: "demo-analyst",
    name: "Telemetry Analyst",
    email: "analyst@gpsshield.local",
    password: "User123!",
    role: Roles.USER,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date("2026-04-18T00:00:00.000Z")
  }
];

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export function isDatabaseUnavailableError(error) {
  const message = String(error?.message ?? "");

  return (
    !env.isProduction &&
    (error?.name === "PrismaClientInitializationError" ||
      error?.code === "P1001" ||
      message.includes("Can't reach database server") ||
      message.includes("connect ECONNREFUSED") ||
      message.includes("Environment variable not found: DATABASE_URL"))
  );
}

export function findDemoUserByEmail(email) {
  return demoUsers.find((user) => normalizeEmail(user.email) === normalizeEmail(email)) ?? null;
}

export function findDemoUserById(userId) {
  return demoUsers.find((user) => user.id === userId) ?? null;
}

export function authenticateDemoUser(email, password) {
  const user = findDemoUserByEmail(email);

  if (!user || user.password !== password) {
    return null;
  }

  user.lastLoginAt = new Date();
  return user;
}

export function serializeDemoUser(user) {
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
