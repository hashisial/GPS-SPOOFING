import { z } from "zod";
import {
  DEVICE_ONLINE_FILTER_VALUES,
  DEVICE_STATUS_VALUES,
  DEVICE_TYPE_VALUES
} from "../../constants/device.js";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "A valid id is required");

const optionalTrimmedString = (maxLength) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .nullable()
    .transform((value) => (value === "" ? null : value ?? null));

export const listDevicesSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional().default(""),
    status: z.enum(DEVICE_STATUS_VALUES).optional(),
    type: z.enum(DEVICE_TYPE_VALUES).optional(),
    owner: objectIdSchema.optional(),
    online: z.enum(DEVICE_ONLINE_FILTER_VALUES).optional(),
    sortBy: z
      .enum(["createdAt", "updatedAt", "deviceName", "deviceId", "lastSeen", "status", "type"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc")
  })
};

export const deviceIdParamSchema = {
  params: z.object({
    deviceId: objectIdSchema
  })
};

export const createDeviceSchema = {
  body: z.object({
    deviceName: z
      .string()
      .trim()
      .min(2, "Device name must be at least 2 characters long")
      .max(120),
    deviceId: z.string().trim().min(3).max(60),
    type: z.enum(DEVICE_TYPE_VALUES).default("TRACKER"),
    owner: objectIdSchema.optional().nullable(),
    status: z.enum(DEVICE_STATUS_VALUES).optional().default("OFFLINE"),
    lastSeen: z.coerce.date().optional().nullable(),
    notes: optionalTrimmedString(500)
  })
};

export const updateDeviceSchema = {
  params: z.object({
    deviceId: objectIdSchema
  }),
  body: z
    .object({
      deviceName: z.string().trim().min(2).max(120).optional(),
      deviceId: z.string().trim().min(3).max(60).optional(),
      type: z.enum(DEVICE_TYPE_VALUES).optional(),
      owner: objectIdSchema.optional().nullable(),
      status: z.enum(DEVICE_STATUS_VALUES).optional(),
      lastSeen: z.coerce.date().optional().nullable(),
      notes: optionalTrimmedString(500)
    })
    .refine((payload) => Object.keys(payload).length > 0, {
      message: "At least one field is required"
    })
};
