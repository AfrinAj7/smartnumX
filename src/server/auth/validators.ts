import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(8).max(128);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  phone: z.union([
    z.literal(""),
    z.string().trim().regex(/^\+?[1-9]\d{7,14}$/),
  ]).optional(),
  password,
  acceptedTerms: z.literal(true),
});

export const loginSchema = z.object({ email, password });

export const emailSchema = z.object({ email });

export const tokenSchema = z.object({ token: z.string().min(32).max(128) });

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(128),
  password,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  password,
}).refine((data) => data.currentPassword !== data.password, {
  path: ["password"],
  message: "Choose a password different from your current one.",
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;