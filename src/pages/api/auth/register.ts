import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { registerSchema } from "@/lib/validation/authSchemas";
import { logError } from "@/lib/logger";

export const prerender = false;

interface RegisterPayload {
  email: string;
  password: string;
  passwordConfirm: string;
}

const jsonHeaders = {
  "Content-Type": "application/json",
};

const buildFieldErrors = (error: ZodError<RegisterPayload>) => {
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
    logError("Supabase client is unavailable in POST /api/auth/register");

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "SUPABASE_CLIENT_UNAVAILABLE",
          message: "Unable to complete sign up.",
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
    logError("Invalid JSON payload received in POST /api/auth/register:", error);

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

  const validationResult = registerSchema.safeParse(payload);

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

  const { email, password } = validationResult.data;

  try {
    // Check if user already exists using admin API
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseServiceKey) {
      // Use admin client to check if user exists
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

      if (listError) {
        logError("Error checking existing users:", listError);
      } else if (existingUsers && existingUsers.users) {
        const userExists = existingUsers.users.some((user) => user.email === email);
        if (userExists) {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: "EMAIL_IN_USE",
                message: "This email is already registered.",
              },
            }),
            {
              status: 409,
              headers: jsonHeaders,
            }
          );
        }
      }
    } else {
      logError("SUPABASE_SERVICE_ROLE_KEY not configured - cannot check for existing users");
    }

    // User doesn't exist, proceed with signup
    const { error } = await locals.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      logError("Supabase sign up error:", error);

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "SIGN_UP_FAILED",
            message: "Unable to sign up. Please try again.",
          },
        }),
        {
          status: 500,
          headers: jsonHeaders,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: "Account created! Check your email to confirm your address before signing in.",
        },
      }),
      {
        status: 200,
        headers: jsonHeaders,
      }
    );
  } catch (error) {
    logError("Unexpected error during POST /api/auth/register:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "UNEXPECTED_ERROR",
          message: "An unexpected error occurred. Please try again.",
        },
      }),
      {
        status: 500,
        headers: jsonHeaders,
      }
    );
  }
};
