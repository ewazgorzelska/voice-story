import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validation/authSchemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { login } from "@/lib/services/authService";

interface LoginFormProps {
  showResetSuccess?: boolean;
}

const LoginForm = ({ showResetSuccess = false }: LoginFormProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      const result = await login(data);
      const redirectPath = result?.redirectPath || "/stories";
      window.location.assign(redirectPath);
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

      if (isErrorWithCode(error) && error.code === "INVALID_CREDENTIALS") {
        setError("root.form", { message: "Invalid email or password." });
      } else if (isErrorWithCode(error) && error.code === "INVALID_INPUT" && hasFieldErrors(error.details)) {
        const fieldErrors = error.details.fieldErrors;
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          if (messages.length > 0) {
            setError(field as keyof LoginInput, { message: messages[0] });
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
        <CardTitle className="text-xl sm:text-2xl">Welcome back</CardTitle>
        <CardDescription className="text-sm">Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {showResetSuccess && (
            <div
              role="status"
              className="rounded-md border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400"
            >
              Password updated successfully! You can now sign in with your new password.
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
              autoComplete="current-password"
              placeholder="Enter your password"
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
          </div>

          <div className="flex items-center justify-end">
            <a href="/auth/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </a>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-primary hover:underline">
              Sign up
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
