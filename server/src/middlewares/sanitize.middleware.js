const RAW_STRING_FIELDS = new Set(["password", "confirmPassword", "token", "refreshToken"]);

function sanitizeString(value) {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/javascript:/gi, "")
    .replace(/\u0000/g, "")
    .trim();
}

function sanitizeKeyValuePairs(value, parentKey = "") {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeKeyValuePairs(item, parentKey));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((accumulator, [key, nestedValue]) => {
      if (key.startsWith("$") || key.includes(".")) {
        return accumulator;
      }

      accumulator[key] = sanitizeKeyValuePairs(nestedValue, key);
      return accumulator;
    }, {});
  }

  if (typeof value === "string") {
    if (RAW_STRING_FIELDS.has(parentKey)) {
      return value.trim();
    }

    return sanitizeString(value);
  }

  return value;
}

export function sanitizeRequestMiddleware(req, _res, next) {
  req.body = sanitizeKeyValuePairs(req.body);
  req.query = sanitizeKeyValuePairs(req.query);
  req.params = sanitizeKeyValuePairs(req.params);
  next();
}
