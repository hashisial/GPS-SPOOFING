import { z } from "../../utils/vendor.js";

export const updateSettingsSchema = {
  body: z
    .object({
      theme: z.enum(["dark", "light"]).optional(),
      notifications: z
        .object({
          emailAlerts: z.boolean().optional(),
          inAppAlerts: z.boolean().optional(),
          soundAlerts: z.boolean().optional(),
          digestFrequency: z.enum(["OFF", "DAILY", "WEEKLY"]).optional()
        })
        .optional(),
      thresholds: z
        .object({
          jumpDistanceKm: z.number().min(0).optional(),
          unrealisticSpeedKph: z.number().min(0).optional(),
          signalAnomalyScore: z.number().min(0).max(100).optional(),
          accuracyThresholdM: z.number().min(0).optional()
        })
        .optional()
    })
    .refine((payload) => Object.keys(payload).length > 0, {
      message: "At least one settings field is required"
    })
};

