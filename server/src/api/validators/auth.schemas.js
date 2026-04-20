import { z } from "../../utils/vendor.js";
import { ROLE_VALUES } from "../../constants/roles.js";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must not exceed 128 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
    "Password must include uppercase, lowercase, number, and special character"
  );

export const registerSchema = {
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters long").max(80),
    email: z.string().trim().email("A valid email address is required"),
    password: passwordSchema,
    role: z.enum(ROLE_VALUES).optional()
  })
};

export const loginSchema = {
  body: z.object({
    email: z.string().trim().email("A valid email address is required"),
    password: z.string().min(1, "Password is required")
  })
};

export const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().min(1).optional()
  })
};

export const logoutSchema = {
  body: z.object({
    refreshToken: z.string().min(1).optional()
  })
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().trim().email("A valid email address is required")
  })
};

export const resetPasswordSchema = {
  body: z
    .object({
      token: z.string().min(1, "Reset token is required"),
      password: passwordSchema,
      confirmPassword: z.string().min(1, "Please confirm your password")
    })
    .refine((payload) => payload.password === payload.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"]
    })
};

