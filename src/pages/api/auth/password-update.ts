import type { APIRoute } from "astro";
import { ZodError, z } from "zod";
import { logError } from "@/lib/logger";

export const prerender = false;

interface PasswordUpdatePayload {
  password: string;
  passwordConfirm: string;
}

// Password validation: minimum 12 chars, must include 1 uppercase, 1 lowercase, 1 digit
const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters with upper, lower, and a number.")
  .regex(/[A-Z]/, "Use at least 8 characters with upper, lower, and a number.")
  .regex(/[a-z]/, "Use at least 8 characters with upper, lower, and a number.")
  .regex(/[0-9]/, "Use at least 8 characters with upper, lower, and a number.");

const passwordUpdateSchema = z
  .object({
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords must match.",
    path: ["passwordConfirm"],
  });

const jsonHeaders = {
  "Content-Type": "application/json",
};

const buildFieldErrors = (error: ZodError<PasswordUpdatePayload>) => {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field !== "string") {
      continue;
    }

    if (!fieldErrors[field]) {
      fieldErrors[field] = [];
    }

    fieldErrors[field].push(issue.message);
  }

  return fieldErrors;
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals?.supabase) {
    logError("Supabase client is unavailable in POST /api/auth/password-update");

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "SUPABASE_CLIENT_UNAVAILABLE",
          message: "Unable to complete password reset.",
        },
      }),
      {
        status: 500,
        headers: jsonHeaders,
      }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error) {
    logError("Invalid JSON payload received in POST /api/auth/password-update:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON.",
        },
      }),
      {
        status: 400,
        headers: jsonHeaders,
      }
    );
  }

  const validationResult = passwordUpdateSchema.safeParse(payload);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Please correct the highlighted errors and try again.",
          details: {
            fieldErrors: buildFieldErrors(validationResult.error),
          },
        },
      }),
      {
        status: 422,
        headers: jsonHeaders,
      }
    );
  }

  const { password } = validationResult.data;

  try {
    // Verify user has an active session (should be set via recovery token in URL)
    const {
      data: { user: currentUser },
    } = await locals.supabase.auth.getUser();

    if (!currentUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "EXPIRED_OR_INVALID_TOKEN",
            message: "This reset link is no longer valid. Request a new one.",
          },
        }),
        {
          status: 401,
          headers: jsonHeaders,
        }
      );
    }

    // Update the password using the authenticated session
    const {
      data: { user },
      error: updateError,
    } = await locals.supabase.auth.updateUser({
      password,
    });

    if (updateError || !user) {
      if (updateError?.name !== "AuthApiError") {
        logError("Supabase password update error:", updateError);
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "PASSWORD_UPDATE_FAILED",
            message: "Unable to update password. Please try again.",
          },
        }),
        {
          status: 400,
          headers: jsonHeaders,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: "Password updated successfully.",
        },
      }),
      {
        status: 200,
        headers: jsonHeaders,
      }
    );
  } catch (error) {
    logError("Unexpected error during POST /api/auth/password-update:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "UNEXPECTED_ERROR",
          message: "Something went wrong while updating password. Please try again.",
        },
      }),
      {
        status: 500,
        headers: jsonHeaders,
      }
    );
  }
};
