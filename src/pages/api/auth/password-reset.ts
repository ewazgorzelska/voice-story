import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { forgotPasswordSchema } from "@/lib/validation/authSchemas";
import { logError } from "@/lib/logger";

export const prerender = false;

interface PasswordResetPayload {
  email: string;
}

const jsonHeaders = {
  "Content-Type": "application/json",
};

const buildFieldErrors = (error: ZodError<PasswordResetPayload>) => {
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
    logError("Supabase client is unavailable in POST /api/auth/password-reset");

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "SUPABASE_CLIENT_UNAVAILABLE",
          message: "Unable to process password reset request.",
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
    logError("Invalid JSON payload received in POST /api/auth/password-reset:", error);

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

  const validationResult = forgotPasswordSchema.safeParse(payload);

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

  const { email } = validationResult.data;

  try {
    // Get the origin from the request to construct the redirect URL
    const origin = new URL(request.url).origin;
    const redirectTo = `${origin}/auth/reset`;

    const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      // Log the error but don't reveal if email exists for security
      if (error?.name !== "AuthApiError") {
        logError("Supabase password reset error:", error);
      }

      // For security, we still return success even if email doesn't exist
      // This prevents email enumeration attacks
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: "If an account exists with that email, a password reset link has been sent.",
          },
        }),
        {
          status: 200,
          headers: jsonHeaders,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: "Password reset email sent successfully.",
        },
      }),
      {
        status: 200,
        headers: jsonHeaders,
      }
    );
  } catch (error) {
    logError("Unexpected error during POST /api/auth/password-reset:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "UNEXPECTED_ERROR",
          message: "Something went wrong while processing your request. Please try again.",
        },
      }),
      {
        status: 500,
        headers: jsonHeaders,
      }
    );
  }
};
