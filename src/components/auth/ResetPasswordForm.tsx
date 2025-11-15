import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/authSchemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { resetPassword } from "@/lib/services/authService";

const ResetPasswordForm = () => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      await resetPassword(data);
      window.location.assign("/login?reset=success");
    } catch (error) {
      const isErrorWithCode = (err: unknown): err is { code: string; message?: string; details?: unknown } => {
        return typeof err === "object" && err !== null && "code" in err;
      };

      const hasFieldErrors = (details: unknown): details is { fieldErrors: Record<string, string[]> } => {
        return (
          typeof details === "object" &&
          details !== null &&
          "fieldErrors" in details &&
          typeof details.fieldErrors === "object"
        );
      };

      if (isErrorWithCode(error) && error.code === "EXPIRED_OR_INVALID_TOKEN") {
        setError("root.form", { message: "This reset link is no longer valid. Request a new one." });
      } else if (isErrorWithCode(error) && error.code === "INVALID_INPUT" && hasFieldErrors(error.details)) {
        const fieldErrors = error.details.fieldErrors;
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          if (messages.length > 0) {
            setError(field as keyof ResetPasswordInput, { message: messages[0] });
          }
        });
      } else {
        const message =
          error instanceof Error ? error.message : "Something went wrong. Please try again or contact support.";
        setError("root.form", { message });
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Set new password</CardTitle>
        <CardDescription className="text-sm">Choose a strong password for your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root?.form && (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {errors.root.form.message}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
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
            {isSubmitting ? "Updating password..." : "Update password"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <a href="/login" className="text-primary hover:underline">
              Back to sign in
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default ResetPasswordForm;
