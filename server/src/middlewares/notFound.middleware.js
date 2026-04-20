import { StatusCodes } from "../utils/vendor.js";

export function notFoundMiddleware(req, res) {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

