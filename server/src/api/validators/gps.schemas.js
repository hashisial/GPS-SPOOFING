import { z } from "../../utils/vendor.js";

export const ingestGpsDataSchema = {
  body: z.object({
    deviceId: z.string().trim().min(3, "Device ID is required").max(60),
    latitude: z.coerce.number().min(-90, "Latitude must be between -90 and 90").max(90),
    longitude: z.coerce.number().min(-180, "Longitude must be between -180 and 180").max(180),
    speed: z.coerce.number().min(0, "Speed must be a non-negative number"),
    accuracy: z.coerce.number().min(0, "Accuracy must be a non-negative number"),
    heading: z.coerce.number().min(0, "Heading must be between 0 and 360").max(360),
    timestamp: z.coerce.date()
  })
};

export const ingestDeviceGpsDataSchema = {
  body: z.object({
    deviceId: z.string().trim().min(3).max(60).optional(),
    latitude: z.coerce.number().min(-90, "Latitude must be between -90 and 90").max(90),
    longitude: z.coerce.number().min(-180, "Longitude must be between -180 and 180").max(180),
    speed: z.coerce.number().min(0, "Speed must be a non-negative number"),
    accuracy: z.coerce.number().min(0, "Accuracy must be a non-negative number"),
    heading: z.coerce.number().min(0, "Heading must be between 0 and 360").max(360),
    timestamp: z.coerce.date()
  })
};

export const listLiveGpsSchema = {
  query: z.object({
    deviceId: z.string().trim().min(3).max(60).optional(),
    status: z.enum(["ALL", "ONLINE", "OFFLINE"]).optional().default("ALL"),
    trailLimit: z.coerce.number().int().min(2).max(50).optional().default(12)
  })
};

