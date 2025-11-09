import type { APIRoute } from "astro";

import { createSupabaseServerInstance } from "@/db/supabase.client";
import { loginSchema } from "@/lib/validation/authSchemas";

export const prerender = false;

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

export const POST: APIRoute = async ({ request, cookies }) => {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to parse login payload", error);
    return jsonResponse(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Invalid request body.",
        },
      },
      400
    );
  }

  const parsedPayload = loginSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return jsonResponse(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Please check the provided credentials.",
          details: parsedPayload.error.flatten(),
        },
      },
      400
    );
  }

  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.signInWithPassword({
      email: parsedPayload.data.email,
      password: parsedPayload.data.password,
    });

    if (error || !user) {
      return jsonResponse(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password.",
          },
        },
        400
      );
    }

    const { data: voiceSample, error: voiceSampleError } = await supabase
      .from("voice_samples")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (voiceSampleError) {
      // eslint-disable-next-line no-console
      console.error("Failed to determine voice sample status", voiceSampleError);
      return jsonResponse(
        {
          success: false,
          error: {
            code: "VOICE_SAMPLE_CHECK_FAILED",
            message: "Something went wrong. Please try again or contact support.",
          },
        },
        500
      );
    }

    const redirectPath = voiceSample ? "/stories" : "/voice-sample";

    return jsonResponse(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
          },
          redirectPath,
        },
      },
      200
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error during login", error);
    return jsonResponse(
      {
        success: false,
        error: {
          code: "UNKNOWN_ERROR",
          message: "Something went wrong. Please try again or contact support.",
        },
      },
      500
    );
  }
};
