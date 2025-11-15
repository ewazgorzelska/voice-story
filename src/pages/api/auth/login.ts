import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { loginSchema } from "@/lib/validation/authSchemas";
import { logError } from "@/lib/logger";

export const prerender = false;

interface LoginPayload {
  email: string;
  password: string;
}

const jsonHeaders = {
  "Content-Type": "application/json",
};

const buildFieldErrors = (error: ZodError<LoginPayload>) => {
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
    logError("Supabase client is unavailable in POST /api/auth/login");

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "SUPABASE_CLIENT_UNAVAILABLE",
          message: "Unable to complete sign in.",
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
    logError("Invalid JSON payload received in POST /api/auth/login:", error);

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

  const validationResult = loginSchema.safeParse(payload);

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
    const {
      data: { user },
      error,
    } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !user) {
      if (error?.name !== "AuthApiError") {
        logError("Supabase sign in error:", error);
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password.",
          },
        }),
        {
          status: 401,
          headers: jsonHeaders,
        }
      );
    }

    let redirectPath = "/stories";

    const { data: voiceSample, error: voiceSampleError } = await locals.supabase
      .from("voice_samples")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (voiceSampleError) {
      logError("Failed to fetch voice sample during POST /api/auth/login:", voiceSampleError);
    } else if (!voiceSample) {
      redirectPath = "/voice-sample";
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          redirectPath,
        },
      }),
      {
        status: 200,
        headers: jsonHeaders,
      }
    );
  } catch (error) {
    logError("Unexpected error during POST /api/auth/login:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "UNEXPECTED_ERROR",
          message: "Something went wrong while signing in. Please try again.",
        },
      }),
      {
        status: 500,
        headers: jsonHeaders,
      }
    );
  }
};
