import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/lib/validation/authSchemas";

export type LoginInput = typeof loginSchema._type;

export const login = async (credentials: LoginInput) => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw data.error || new Error("An unknown error occurred");
  }

  return data.data;
};

export type RegisterInput = typeof registerSchema._type;
export const register = async (userData: RegisterInput) => {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw data.error || new Error("An unknown error occurred");
  }
  return data.data;
};

export type ForgotPasswordInput = typeof forgotPasswordSchema._type;
export const forgotPassword = async (input: ForgotPasswordInput) => {
  const response = await fetch("/api/auth/password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok) {
    throw data.error || new Error("An unknown error occurred");
  }
  return data;
};

export type ResetPasswordInput = typeof resetPasswordSchema._type;
export const resetPassword = async (input: ResetPasswordInput) => {
  const response = await fetch("/api/auth/password-update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw data.error || new Error("An unknown error occurred");
  }

  return data;
};
