// src/pages/api/voice-sample/[id]/verify.ts

import type { APIRoute } from "astro";
import type { VerifyVoiceSampleResponseDto } from "../../../../types";
import { verifyVoiceSampleSchema, voiceSampleIdSchema } from "../../../../lib/schemas/voiceSampleSchemas";
import { verifyVoiceSample } from "../../../../lib/services/voiceSampleService";
import { ZodError } from "zod";

export const prerender = false;

/**
 * PATCH /api/voice-sample/:id/verify
 *
 * Marks a voice sample as verified for the authenticated user.
 * Only the owner of the voice sample can verify it.
 *
 * @returns 200 - Voice sample verified successfully
 * @returns 400 - Bad request (invalid input)
 * @returns 401 - Unauthorized (missing/invalid token)
 * @returns 404 - Not found (sample not found or not owned by user)
 * @returns 422 - Unprocessable Entity (validation errors)
 * @returns 500 - Internal server error
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
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

  // Validate path parameter (voice sample ID)
  const sampleId = params.id;
  try {
    voiceSampleIdSchema.parse(sampleId);
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          message: "Invalid voice sample ID format",
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
    validatedData = verifyVoiceSampleSchema.parse(requestBody);
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

  // Verify voice sample
  try {
    if (!sampleId) {
      return new Response(
        JSON.stringify({
          message: "Voice sample ID is required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const result = await verifyVoiceSample(locals.supabase, user.id, sampleId, validatedData.verified);

    const response: VerifyVoiceSampleResponseDto = result;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error verifying voice sample:", error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message === "VOICE_SAMPLE_NOT_FOUND" || error.message === "VOICE_SAMPLE_UNAUTHORIZED") {
        // Return 404 for both cases to avoid leaking information
        return new Response(
          JSON.stringify({
            message: "Voice sample not found",
          }),
          {
            status: 404,
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
        message: "Failed to verify voice sample",
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
