import { useState } from "react";
import { registerSchema, type RegisterInput } from "@/lib/validation/authSchemas";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Label from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegisterForm() {
  const [formData, setFormData] = useState<RegisterInput>({
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterInput | "form", string>>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name as keyof RegisterInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (successMessage) {
      setSuccessMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage(null);
    setIsLoading(true);

    // Client-side validation
    const validation = registerSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof RegisterInput, string>> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof RegisterInput] = err.message;
        }
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const defaultMessage = "Something went wrong. Please try again or contact support.";
        const errorCode: string | undefined = data.error?.code;

        if (errorCode === "EMAIL_IN_USE") {
          setErrors({ email: "This email is already registered." });
        } else if (errorCode === "INVALID_INPUT") {
          const fieldErrorsPayload = data.error?.details?.fieldErrors as Record<string, string[]> | undefined;

          const nextErrors: Partial<Record<keyof RegisterInput | "form", string>> = {};

          if (fieldErrorsPayload) {
            const fields: (keyof RegisterInput)[] = ["email", "password", "passwordConfirm"];
            fields.forEach((field) => {
              const messages = fieldErrorsPayload[field];
              if (messages?.length) {
                nextErrors[field] = messages[0];
              }
            });
          }

          if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
          } else {
            setErrors({ form: data.error?.message || defaultMessage });
          }
        } else {
          setErrors({ form: data.error?.message || defaultMessage });
        }

        setIsLoading(false);
        return;
      }

      setSuccessMessage(
        data.data?.message || "Account created! Check your email to confirm your address before signing in."
      );
      setFormData({
        email: "",
        password: "",
        passwordConfirm: "",
      });
      setIsLoading(false);
    } catch {
      setErrors({ form: "Something went wrong. Please try again or contact support." });
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Create an account</CardTitle>
        <CardDescription className="text-sm">Sign up to start creating personalized voice stories</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {successMessage && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary"
            >
              {successMessage} You can sign in after confirming your email.
            </div>
          )}

          {errors.form && (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {errors.form}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {errors.password}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              At least 12 characters with uppercase, lowercase, and a number
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">Confirm Password</Label>
            <Input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm your password"
              value={formData.passwordConfirm}
              onChange={handleChange}
              disabled={isLoading}
              aria-invalid={!!errors.passwordConfirm}
              aria-describedby={errors.passwordConfirm ? "passwordConfirm-error" : undefined}
            />
            {errors.passwordConfirm && (
              <p id="passwordConfirm-error" className="text-sm text-destructive">
                {errors.passwordConfirm}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create account"}
          </Button>

          <p className="text-xs text-muted-foreground">
            After you sign up, we&apos;ll email you a confirmation link. You need to confirm your email before you can
            sign in.
          </p>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
