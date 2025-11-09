import { z } from "zod";

// Password validation: minimum 12 chars, must include 1 uppercase, 1 lowercase, 1 digit
const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters with upper, lower, and a number.")
  .regex(/[A-Z]/, "Use at least 12 characters with upper, lower, and a number.")
  .regex(/[a-z]/, "Use at least 12 characters with upper, lower, and a number.")
  .regex(/[0-9]/, "Use at least 12 characters with upper, lower, and a number.");

// Email validation: required, RFC 5322 compliant
const emailSchema = z.string().email("Enter a valid email address.");

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

// Registration schema
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords must match.",
    path: ["passwordConfirm"],
  });

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Reset password schema
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords must match.",
    path: ["passwordConfirm"],
  });

// TypeScript types
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
