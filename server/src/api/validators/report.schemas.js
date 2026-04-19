import { z } from "zod";
import { ALERT_SEVERITY_VALUES, ALERT_STATUS_VALUES } from "../../constants/alert.js";
import {
  REPORT_EXPORT_FORMAT_VALUES,
  REPORT_TYPE_VALUES
} from "../../constants/report.js";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "A valid report id is required");

export const generateReportSchema = {
  body: z
    .object({
      type: z.enum(REPORT_TYPE_VALUES),
      title: z.string().trim().min(3).max(160).optional(),
      periodStart: z.coerce.date().optional().nullable(),
      periodEnd: z.coerce.date().optional().nullable(),
      deviceId: z.string().trim().min(3).max(60).optional().nullable(),
      severity: z.enum(ALERT_SEVERITY_VALUES).optional(),
      status: z.enum(ALERT_STATUS_VALUES).optional()
    })
    .refine((payload) => payload.type !== "DEVICE" || Boolean(payload.deviceId), {
      message: "deviceId is required for device reports",
      path: ["deviceId"]
    })
};

export const listReportsSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional().default(""),
    type: z.enum(REPORT_TYPE_VALUES).optional(),
    sortBy: z.enum(["createdAt", "updatedAt", "title", "type", "periodStart"]).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc")
  })
};

export const reportIdParamSchema = {
  params: z.object({
    reportId: objectIdSchema
  })
};

export const exportReportSchema = {
  params: z.object({
    reportId: objectIdSchema
  }),
  query: z.object({
    format: z.enum(REPORT_EXPORT_FORMAT_VALUES)
  })
};
