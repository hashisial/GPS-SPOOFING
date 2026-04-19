import { createHash, randomBytes } from "node:crypto";

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateRandomToken(size = 32) {
  return randomBytes(size).toString("hex");
}
