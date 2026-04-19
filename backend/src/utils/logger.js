import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const backendRoot = path.resolve(path.dirname(currentFilePath), "..", "..");
const logDirectory = path.join(backendRoot, "logs");
const logFile = path.join(logDirectory, "app.log");

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

function write(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  };

  const serialized = `${JSON.stringify(entry)}\n`;

  fs.appendFileSync(logFile, serialized, "utf8");

  if (level === "error") {
    console.error(serialized.trim());
    return;
  }

  console.log(serialized.trim());
}

export const logger = {
  info(message, meta) {
    write("info", message, meta);
  },
  warn(message, meta) {
    write("warn", message, meta);
  },
  error(message, meta) {
    write("error", message, meta);
  },
  http(message, meta) {
    write("http", message, meta);
  }
};
