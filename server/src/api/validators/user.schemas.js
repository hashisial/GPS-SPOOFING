import { z } from "zod";
import { ROLE_VALUES } from "../../constants/roles.js";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "A valid user id is required");

const userPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must not exceed 128 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
    "Password must include uppercase, lowercase, number, and special character"
  );

export const listUsersSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional().default(""),
    role: z.enum(ROLE_VALUES).optional(),
    status: z.enum(["ACTIVE", "BLOCKED"]).optional(),
    sortBy: z
      .enum(["createdAt", "updatedAt", "name", "email", "role", "lastLoginAt"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc")
  })
};

export const userIdParamSchema = {
  params: z.object({
    userId: objectIdSchema
  })
};

export const createUserSchema = {
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters long").max(80),
    email: z.string().trim().email("A valid email address is required"),
    password: userPasswordSchema,
    role: z.enum(ROLE_VALUES)
  })
};

export const updateUserSchema = {
  params: z.object({
    userId: objectIdSchema
  }),
  body: z
    .object({
      name: z.string().trim().min(2).max(80).optional(),
      email: z.string().trim().email("A valid email address is required").optional(),
      password: userPasswordSchema.optional(),
      role: z.enum(ROLE_VALUES).optional()
    })
    .refine((payload) => Object.keys(payload).length > 0, {
      message: "At least one field is required"
    })
};

export const blockUserSchema = {
  params: z.object({
    userId: objectIdSchema
  }),
  body: z.object({
    reason: z.string().trim().max(250).optional().default("Blocked by administrator")
  })
};
