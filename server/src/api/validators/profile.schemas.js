import { z } from "zod";

export const updateProfileSchema = {
  body: z
    .object({
      name: z.string().trim().min(2).max(80).optional(),
      email: z.string().trim().email("A valid email address is required").optional()
    })
    .refine((payload) => Object.keys(payload).length > 0, {
      message: "At least one profile field is required"
    })
};
