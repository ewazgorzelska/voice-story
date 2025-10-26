// src/pages/api/voice-sample/index.ts

import type { APIRoute } from "astro";
import type { VoiceSampleDto } from "../../../types";
import { createVoiceSampleSchema } from "../../../lib/schemas/voiceSampleSchemas";
import { createVoiceSample } from "../../../lib/services/voiceSampleService";
import { ZodError } from "zod";

export const prerender = false;

/**
 * POST /api/voice-sample
 *
 * Creates a new voice sample for the authenticated user.
 * Requires authentication and validates that the user doesn't already have a voice sample.
 *
 * @returns 201 - Voice sample created successfully
 * @returns 400 - Bad request (invalid input)
 * @returns 401 - Unauthorized (missing/invalid token)
 * @returns 409 - Conflict (voice sample already exists)
 * @returns 422 - Unprocessable Entity (validation errors)
 * @returns 500 - Internal server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Authenticate user
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({
        message: "Unauthorized",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Parse and validate request body
  let requestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    console.error("Error parsing JSON in request body:", error);
    return new Response(
      JSON.stringify({
        message: "Invalid JSON in request body",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Validate input with Zod
  let validatedData;
  try {
    validatedData = createVoiceSampleSchema.parse(requestBody);
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          message: "Validation failed",
          errors: error.errors,
        }),
        {
          status: 422,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Invalid request data",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Create voice sample
  try {
    const voiceSample = await createVoiceSample(locals.supabase, user.id, validatedData);

    const response: VoiceSampleDto = voiceSample;

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error creating voice sample:", error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message === "VOICE_SAMPLE_EXISTS") {
        return new Response(
          JSON.stringify({
            message: "Voice sample already exists for this user",
          }),
          {
            status: 409,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (error.message === "VOICE_SERVICE_UNAVAILABLE") {
        return new Response(
          JSON.stringify({
            message: "Voice service unavailable",
          }),
          {
            status: 502,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    // Generic server error
    return new Response(
      JSON.stringify({
        message: "Failed to create voice sample",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
