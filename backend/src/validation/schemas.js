import {
  AlertSeverities,
  AlertStatuses,
  DeviceStatuses,
  ReportTypes
} from "../constants/roles.js";
import { createValidationError } from "./request-validator.js";

function pushError(errors, path, message) {
  errors.push({ path, message });
}

function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseRequiredString(value, path, errors, { min = 1, max = 255 } = {}) {
  const nextValue = asTrimmedString(value);

  if (!nextValue) {
    pushError(errors, path, "This field is required.");
    return "";
  }

  if (nextValue.length < min || nextValue.length > max) {
    pushError(errors, path, `Must be between ${min} and ${max} characters.`);
  }

  return nextValue;
}

function parseOptionalString(value, path, errors, { max = 255 } = {}) {
  const nextValue = asTrimmedString(value);

  if (!nextValue) {
    return undefined;
  }

  if (nextValue.length > max) {
    pushError(errors, path, `Must be at most ${max} characters.`);
  }

  return nextValue;
}

function parseEmail(value, path, errors) {
  const nextValue = asTrimmedString(value).toLowerCase();

  if (!nextValue) {
    pushError(errors, path, "Email is required.");
    return "";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(nextValue)) {
    pushError(errors, path, "Must be a valid email address.");
  }

  return nextValue;
}

function parseNumber(value, path, errors, { min, max, required = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      pushError(errors, path, "This field is required.");
    }
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    pushError(errors, path, "Must be a valid number.");
    return undefined;
  }

  if (min !== undefined && parsed < min) {
    pushError(errors, path, `Must be greater than or equal to ${min}.`);
  }

  if (max !== undefined && parsed > max) {
    pushError(errors, path, `Must be less than or equal to ${max}.`);
  }

  return parsed;
}

function parseBoolean(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

function parseDate(value, path, errors, required = false) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      pushError(errors, path, "This field is required.");
    }
    return undefined;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    pushError(errors, path, "Must be a valid ISO date.");
    return undefined;
  }

  return parsed;
}

function parseEnum(value, path, errors, allowedValues, required = false) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      pushError(errors, path, "This field is required.");
    }
    return undefined;
  }

  if (!allowedValues.includes(value)) {
    pushError(errors, path, `Must be one of: ${allowedValues.join(", ")}.`);
    return undefined;
  }

  return value;
}

function parsePagination(query, errors) {
  return {
    page: parseNumber(query.page ?? 1, "page", errors, { min: 1, required: true }) ?? 1,
    pageSize:
      parseNumber(query.pageSize ?? 25, "pageSize", errors, {
        min: 1,
        max: 100,
        required: true
      }) ?? 25
  };
}

function finalize(errors, payload) {
  if (errors.length > 0) {
    throw createValidationError(errors);
  }

  return payload;
}

export const authSchemas = {
  register: {
    body(body) {
      const errors = [];
      const payload = {
        name: parseRequiredString(body.name, "name", errors, { min: 2, max: 80 }),
        email: parseEmail(body.email, "email", errors),
        password: parseRequiredString(body.password, "password", errors, {
          min: 8,
          max: 72
        })
      };

      return finalize(errors, payload);
    }
  },
  login: {
    body(body) {
      const errors = [];
      const payload = {
        email: parseEmail(body.email, "email", errors),
        password: parseRequiredString(body.password, "password", errors, {
          min: 8,
          max: 72
        })
      };

      return finalize(errors, payload);
    }
  }
};

export const gpsSchemas = {
  ingest: {
    body(body) {
      const errors = [];
      const payload = {
        deviceId: parseRequiredString(body.deviceId, "deviceId", errors, {
          min: 3,
          max: 40
        }),
        latitude: parseNumber(body.latitude, "latitude", errors, {
          min: -90,
          max: 90,
          required: true
        }),
        longitude: parseNumber(body.longitude, "longitude", errors, {
          min: -180,
          max: 180,
          required: true
        }),
        speedKph: parseNumber(body.speedKph, "speedKph", errors, {
          min: 0,
          max: 1500
        }),
        headingDegrees: parseNumber(body.headingDegrees, "headingDegrees", errors, {
          min: 0,
          max: 360
        }),
        signalStrength: parseNumber(body.signalStrength, "signalStrength", errors, {
          min: 0,
          max: 100
        }),
        accuracyMeters: parseNumber(body.accuracyMeters, "accuracyMeters", errors, {
          min: 0,
          max: 10000
        }),
        satelliteCount: parseNumber(body.satelliteCount, "satelliteCount", errors, {
          min: 0,
          max: 100
        }),
        timestamp: parseDate(body.timestamp, "timestamp", errors, true),
        rawPayload:
          body.rawPayload && typeof body.rawPayload === "object" ? body.rawPayload : undefined
      };

      return finalize(errors, payload);
    }
  },
  live: {
    query(query) {
      const errors = [];
      const payload = {
        deviceId: parseOptionalString(query.deviceId, "deviceId", errors, { max: 40 }),
        limit: parseNumber(query.limit ?? 25, "limit", errors, {
          min: 1,
          max: 100,
          required: true
        })
      };

      return finalize(errors, payload);
    }
  }
};

export const alertSchemas = {
  list: {
    query(query) {
      const errors = [];
      const payload = {
        ...parsePagination(query, errors),
        deviceId: parseOptionalString(query.deviceId, "deviceId", errors, { max: 40 }),
        status: parseEnum(
          query.status,
          "status",
          errors,
          Object.values(AlertStatuses)
        ),
        severity: parseEnum(
          query.severity,
          "severity",
          errors,
          Object.values(AlertSeverities)
        )
      };

      return finalize(errors, payload);
    }
  }
};

export const historySchemas = {
  list: {
    query(query) {
      const errors = [];
      const payload = {
        ...parsePagination(query, errors),
        deviceId: parseOptionalString(query.deviceId, "deviceId", errors, { max: 40 }),
        from: parseDate(query.from, "from", errors),
        to: parseDate(query.to, "to", errors),
        spoofedOnly: parseBoolean(query.spoofedOnly)
      };

      return finalize(errors, payload);
    }
  }
};

export const reportSchemas = {
  create: {
    body(body) {
      const errors = [];
      const filters = body.filters && typeof body.filters === "object" ? body.filters : {};
      const payload = {
        title: parseOptionalString(body.title, "title", errors, { max: 120 }),
        type: parseEnum(body.type, "type", errors, Object.values(ReportTypes)),
        filters: {
          deviceId: parseOptionalString(filters.deviceId, "filters.deviceId", errors, {
            max: 40
          }),
          from: parseDate(filters.from, "filters.from", errors),
          to: parseDate(filters.to, "filters.to", errors),
          spoofedOnly: parseBoolean(filters.spoofedOnly),
          status: parseEnum(
            filters.status,
            "filters.status",
            errors,
            Object.values(AlertStatuses)
          ),
          severity: parseEnum(
            filters.severity,
            "filters.severity",
            errors,
            Object.values(AlertSeverities)
          )
        }
      };

      return finalize(errors, payload);
    }
  },
  export: {
    query(query) {
      const errors = [];
      const payload = {
        deviceId: parseOptionalString(query.deviceId, "deviceId", errors, { max: 40 }),
        from: parseDate(query.from, "from", errors),
        to: parseDate(query.to, "to", errors),
        spoofedOnly: parseBoolean(query.spoofedOnly),
        status: parseEnum(
          query.status,
          "status",
          errors,
          Object.values(AlertStatuses)
        ),
        severity: parseEnum(
          query.severity,
          "severity",
          errors,
          Object.values(AlertSeverities)
        )
      };

      return finalize(errors, payload);
    }
  }
};

export const userSchemas = {
  list: {
    query(query) {
      const errors = [];
      const payload = {
        ...parsePagination(query, errors),
        search: parseOptionalString(query.search, "search", errors, { max: 120 })
      };

      return finalize(errors, payload);
    }
  },
  create: {
    body(body) {
      const errors = [];
      const payload = {
        name: parseRequiredString(body.name, "name", errors, { min: 2, max: 80 }),
        email: parseEmail(body.email, "email", errors),
        password: parseRequiredString(body.password, "password", errors, {
          min: 8,
          max: 72
        }),
        role: parseEnum(body.role ?? "USER", "role", errors, ["ADMIN", "USER"]),
        isActive: parseBoolean(body.isActive) ?? true
      };

      return finalize(errors, payload);
    }
  },
  update: {
    params(params) {
      const errors = [];
      const payload = {
        id: parseRequiredString(params.id, "id", errors, { min: 3, max: 40 })
      };

      return finalize(errors, payload);
    },
    body(body) {
      const errors = [];
      const payload = {
        name: parseOptionalString(body.name, "name", errors, { max: 80 }),
        role: parseEnum(body.role, "role", errors, ["ADMIN", "USER"]),
        password: parseOptionalString(body.password, "password", errors, { max: 72 }),
        isActive: parseBoolean(body.isActive)
      };

      return finalize(errors, payload);
    }
  }
};

export const deviceSchemas = {
  list: {
    query(query) {
      const errors = [];
      const payload = {
        ...parsePagination(query, errors),
        search: parseOptionalString(query.search, "search", errors, { max: 120 })
      };

      return finalize(errors, payload);
    }
  },
  create: {
    body(body) {
      const errors = [];
      const payload = {
        callsign: parseRequiredString(body.callsign, "callsign", errors, {
          min: 3,
          max: 40
        }),
        label: parseRequiredString(body.label, "label", errors, { min: 2, max: 80 }),
        fleet: parseOptionalString(body.fleet, "fleet", errors, { max: 80 }),
        status: parseEnum(
          body.status ?? "ACTIVE",
          "status",
          errors,
          Object.values(DeviceStatuses)
        ),
        latitude: parseNumber(body.latitude, "latitude", errors, {
          min: -90,
          max: 90
        }),
        longitude: parseNumber(body.longitude, "longitude", errors, {
          min: -180,
          max: 180
        }),
        notes: parseOptionalString(body.notes, "notes", errors, { max: 400 })
      };

      return finalize(errors, payload);
    }
  },
  update: {
    params(params) {
      const errors = [];
      const payload = {
        id: parseRequiredString(params.id, "id", errors, { min: 3, max: 40 })
      };

      return finalize(errors, payload);
    },
    body(body) {
      const errors = [];
      const payload = {
        callsign: parseOptionalString(body.callsign, "callsign", errors, { max: 40 }),
        label: parseOptionalString(body.label, "label", errors, { max: 80 }),
        fleet: parseOptionalString(body.fleet, "fleet", errors, { max: 80 }),
        status: parseEnum(body.status, "status", errors, Object.values(DeviceStatuses)),
        latitude: parseNumber(body.latitude, "latitude", errors, {
          min: -90,
          max: 90
        }),
        longitude: parseNumber(body.longitude, "longitude", errors, {
          min: -180,
          max: 180
        }),
        notes: parseOptionalString(body.notes, "notes", errors, { max: 400 })
      };

      return finalize(errors, payload);
    }
  }
};

export const settingsSchemas = {
  updateSystem: {
    body(body) {
      const errors = [];
      const payload = {
        confidenceThreshold: parseNumber(
          body.confidenceThreshold,
          "confidenceThreshold",
          errors,
          {
            min: 1,
            max: 100,
            required: true
          }
        ),
        driftThresholdMeters: parseNumber(
          body.driftThresholdMeters,
          "driftThresholdMeters",
          errors,
          {
            min: 1,
            max: 500000,
            required: true
          }
        ),
        headingThresholdDegrees: parseNumber(
          body.headingThresholdDegrees,
          "headingThresholdDegrees",
          errors,
          {
            min: 1,
            max: 180,
            required: true
          }
        ),
        emailNotificationsEnabled: parseBoolean(body.emailNotificationsEnabled) ?? false,
        smsNotificationsEnabled: parseBoolean(body.smsNotificationsEnabled) ?? false,
        webhookNotificationsEnabled: parseBoolean(body.webhookNotificationsEnabled) ?? false,
        webhookUrl: parseOptionalString(body.webhookUrl, "webhookUrl", errors, { max: 255 })
      };

      return finalize(errors, payload);
    }
  },
  updateNotifications: {
    body(body) {
      const errors = [];
      const payload = {
        emailEnabled: parseBoolean(body.emailEnabled) ?? false,
        smsEnabled: parseBoolean(body.smsEnabled) ?? false,
        pushEnabled: parseBoolean(body.pushEnabled) ?? false,
        weeklyDigest: parseBoolean(body.weeklyDigest) ?? false,
        criticalOnly: parseBoolean(body.criticalOnly) ?? false,
        preferredEmail:
          body.preferredEmail === "" || body.preferredEmail === undefined
            ? undefined
            : parseEmail(body.preferredEmail, "preferredEmail", errors)
      };

      return finalize(errors, payload);
    }
  }
};
