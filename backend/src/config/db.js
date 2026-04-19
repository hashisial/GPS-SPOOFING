import { PrismaClient } from "@prisma/client";
import env from "./env.js";

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: env.databaseUrl
      }
    },
    log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"]
  });

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
