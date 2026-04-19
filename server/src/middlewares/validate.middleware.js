import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";

function formatZodError(error) {
  return error.issues.map((issue) => issue.message).join("; ");
}

export function validateRequest(schema) {
  return function validateRequestMiddleware(req, _res, next) {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new ApiError(StatusCodes.BAD_REQUEST, formatZodError(error))
        );
      }

      return next(error);
    }
  };
}
