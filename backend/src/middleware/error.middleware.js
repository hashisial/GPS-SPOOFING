import { logger } from "../utils/logger.js";

export function notFound(req, res) {
  return res.status(404).json({
    message: `Route ${req.originalUrl} was not found.`
  });
}

export function errorHandler(error, req, res, next) {
  void req;
  void next;

  const statusCode = error.statusCode ?? 500;

  logger.error("request_failed", {
    statusCode,
    path: req.originalUrl,
    method: req.method,
    message: error.message,
    stack: error.stack
  });

  return res.status(statusCode).json({
    message: error.message ?? "Internal server error.",
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {})
  });
}
