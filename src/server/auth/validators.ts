import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(8).max(128);

const phone = z.preprocess((val) => {
  if (typeof val !== "string") return undefined;
  const cleaned = val.trim().replace(/[\s\-\(\)\.]/g, "");
  return cleaned === "" ? undefined : cleaned;
}, z.string().regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number (10-15 digits)").optional());

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  phone,
  password,
  acceptedTerms: z.literal(true),
});

export const loginSchema = z.object({ email, password });

export const emailSchema = z.object({ email });

export const tokenSchema = z.object({ token: z.string().min(6).max(128) });

export const verifyEmailInputSchema = z.union([
  z.object({ token: z.string().min(6).max(128) }),
  z.object({
    code: z.string().trim().regex(/^\d{6}$/, "Code must be 6 digits"),
    email: z.string().trim().toLowerCase().email(),
  }),
]);

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

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
