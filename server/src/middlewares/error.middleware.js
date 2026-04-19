import { StatusCodes } from "http-status-codes";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export function errorMiddleware(error, req, res, _next) {
  const statusCode = error.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR;
  const message =
    statusCode >= StatusCodes.INTERNAL_SERVER_ERROR
      ? "Internal server error"
      : error.message;

  logger.error(
    {
      err: error,
      requestId: req.id,
      method: req.method,
      url: req.originalUrl
    },
    "Request failed"
  );

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.isDevelopment
      ? {
          stack: error.stack
        }
      : {})
  });
}
