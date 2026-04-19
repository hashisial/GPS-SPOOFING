export function createValidationError(errors) {
  const error = new Error("Validation failed.");
  error.statusCode = 400;
  error.validationErrors = errors;
  return error;
}

export function validateRequest(schema) {
  return (req, res, next) => {
    try {
      if (schema.body) {
        req.body = schema.body(req.body ?? {});
      }

      if (schema.query) {
        req.query = schema.query(req.query ?? {});
      }

      if (schema.params) {
        req.params = schema.params(req.params ?? {});
      }

      return next();
    } catch (error) {
      if (error.validationErrors) {
        return res.status(400).json({
          message: error.message,
          errors: error.validationErrors
        });
      }

      return next(error);
    }
  };
}
