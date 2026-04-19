import { z } from "zod";
import { ALERT_SEVERITY_VALUES, ALERT_STATUS_VALUES } from "../../constants/alert.js";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "A valid alert id is required");

const optionalNoteSchema = z
  .string()
  .trim()
  .max(500, "Note must not exceed 500 characters")
  .optional()
  .default("");

export const listAlertsSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional().default(""),
    severity: z.enum(ALERT_SEVERITY_VALUES).optional(),
    status: z.enum(ALERT_STATUS_VALUES).optional(),
    escalated: z.enum(["true", "false"]).optional(),
    sortBy: z
      .enum(["createdAt", "updatedAt", "triggeredAt", "riskScore", "severity", "status"])
      .optional()
      .default("triggeredAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc")
  })
};

export const alertIdParamSchema = {
  params: z.object({
    alertId: objectIdSchema
  })
};

export const resolveAlertSchema = {
  params: z.object({
    alertId: objectIdSchema
  }),
  body: z.object({
    note: optionalNoteSchema
  })
};

export const falsePositiveAlertSchema = {
  params: z.object({
    alertId: objectIdSchema
  }),
  body: z.object({
    reason: z
      .string()
      .trim()
      .min(3, "Reason must be at least 3 characters long")
      .max(500, "Reason must not exceed 500 characters")
  })
};

export const escalateAlertSchema = {
  params: z.object({
    alertId: objectIdSchema
  }),
  body: z.object({
    note: optionalNoteSchema
  })
};
