import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validation/authSchemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { register as registerUser } from "@/lib/services/authService";

export default function RegisterForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setSuccessMessage(null);
    try {
      const result = await registerUser(data);
      setSuccessMessage(
        result.message || "Account created! Check your email to confirm your address before signing in."
      );
      reset();
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string; details?: unknown };
      if (err.code === "EMAIL_IN_USE") {
        setError("email", { message: "This email is already registered." });
      } else if (
        err.code === "INVALID_INPUT" &&
        err.details &&
        typeof err.details === "object" &&
        "fieldErrors" in err.details
      ) {
        const fieldErrors = err.details.fieldErrors as Record<string, string[]>;
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          if (messages.length > 0) {
            setError(field as keyof RegisterInput, { message: messages[0] });
          }
        });
      } else {
        setError("root.form", {
          message: err.message || "Something went wrong. Please try again or contact support.",
        });
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Create an account</CardTitle>
        <CardDescription className="text-sm">Sign up to start creating personalized voice stories</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {successMessage && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary"
            >
              {successMessage} You can sign in after confirming your email.
            </div>
          )}

          {errors.root?.form && (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {errors.root.form.message}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              disabled={isSubmitting}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Create a strong password"
              disabled={isSubmitting}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {errors.password.message}
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
              type="password"
              autoComplete="new-password"
              placeholder="Confirm your password"
              disabled={isSubmitting}
              aria-invalid={!!errors.passwordConfirm}
              aria-describedby={errors.passwordConfirm ? "passwordConfirm-error" : undefined}
              {...register("passwordConfirm")}
            />
            {errors.passwordConfirm && (
              <p id="passwordConfirm-error" className="text-sm text-destructive">
                {errors.passwordConfirm.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
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
