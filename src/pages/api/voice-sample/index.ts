// src/pages/api/voice-sample/index.ts

import type { APIRoute } from "astro";
import type { VoiceSampleDto } from "../../../types";
import { createVoiceSampleSchema } from "../../../lib/schemas/voiceSampleSchemas";
import { createVoiceSample, deleteVoiceSample } from "../../../lib/services/voiceSampleService";
import { ZodError } from "zod";
import { logError } from "@/lib/logger";

export const prerender = false;

/**
 * GET /api/voice-sample
 *
 * Returns the voice sample for the authenticated user.
 *
 * @returns 200 - Voice sample found
 * @returns 401 - Unauthorized (missing/invalid token)
 * @returns 404 - Not found (no voice sample exists)
 * @returns 500 - Internal server error
 */
export const GET: APIRoute = async ({ locals }) => {
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

  // Fetch user's voice sample
  try {
    const { data: sample, error: fetchError } = await locals.supabase
      .from("voice_samples")
      .select("id, user_id, created_at, verified")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      logError("Error fetching voice sample:", fetchError);
      return new Response(
        JSON.stringify({
          message: "Failed to fetch voice sample",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!sample) {
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

    const response: VoiceSampleDto = sample;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    logError("Error in GET /api/voice-sample:", error);
    return new Response(
      JSON.stringify({
        message: "Internal server error",
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

/**
 * DELETE /api/voice-sample
 *
 * Deletes the voice sample for the authenticated user.
 *
 * @returns 204 - No Content
 * @returns 401 - Unauthorized (missing/invalid token)
 * @returns 404 - Not found (no voice sample exists)
 * @returns 500 - Internal server error
 */
export const DELETE: APIRoute = async ({ locals }) => {
  // Authenticate user
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await deleteVoiceSample(locals.supabase, user.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    logError("Error deleting voice sample:", error);

    if (error instanceof Error && error.message === "VOICE_SAMPLE_NOT_FOUND") {
      return new Response(JSON.stringify({ message: "Voice sample not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/voice-sample
 *
 * Creates a new voice sample for the authenticated user.
 * Requires authentication and validates that the user doesn't already have a voice sample.
 * Accepts multipart/form-data with:
 *   - audio: File (audio/webm)
 *   - verification_phrase: string
 *
 * @returns 201 - Voice sample created successfully
 * @returns 400 - Bad request (invalid input or missing audio file)
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

  // Check for user consent
  let profile = null;
  const { data: existingProfile, error: profileError } = await locals.supabase
    .from("profiles")
    .select("voice_cloning_consent_given")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    logError("Failed to fetch profile for consent check", profileError);
    return new Response(JSON.stringify({ message: "Could not verify user profile" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // If profile doesn't exist, create it with default consent = false
  if (!existingProfile) {
    const { data: newProfile, error: createError } = await locals.supabase
      .from("profiles")
      .insert({ user_id: user.id, voice_cloning_consent_given: false })
      .select("voice_cloning_consent_given")
      .single();

    if (createError || !newProfile) {
      logError("Failed to create profile", createError);
      return new Response(JSON.stringify({ message: "Could not create user profile" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    profile = newProfile;
  } else {
    profile = existingProfile;
  }

  if (!profile.voice_cloning_consent_given) {
    return new Response(JSON.stringify({ message: "Voice cloning consent is required" }), {
      status: 403, // Forbidden
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse FormData
  let formData;
  try {
    formData = await request.formData();
  } catch (error) {
    logError("Error parsing form data:", error);
    return new Response(
      JSON.stringify({
        message: "Invalid form data",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Extract audio file and verification phrase
  const audioFile = formData.get("audio");
  const verificationPhrase = formData.get("verification_phrase");

  if (!audioFile || !(audioFile instanceof File)) {
    return new Response(
      JSON.stringify({
        message: "Audio file is required",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  if (!verificationPhrase || typeof verificationPhrase !== "string") {
    return new Response(
      JSON.stringify({
        message: "Verification phrase is required",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Upload audio file to Supabase Storage
  let audioUrl: string;
  try {
    const timestamp = Date.now();
    const filename = `voice-sample-${user.id}-${timestamp}.webm`;
    const path = `${filename}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await audioFile.arrayBuffer();

    const { error: uploadErr } = await locals.supabase.storage.from("voice-samples").upload(path, arrayBuffer, {
      contentType: "audio/webm",
      upsert: false,
    });

    if (uploadErr) {
      logError("Storage upload error:", uploadErr);
      throw new Error(`Upload failed: ${uploadErr.message}`);
    }

    // Get public URL
    const { data: urlData } = locals.supabase.storage.from("voice-samples").getPublicUrl(path);
    audioUrl = urlData.publicUrl;
  } catch (error) {
    logError("Error uploading audio file:", error);
    return new Response(
      JSON.stringify({
        message: "Failed to upload audio file",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Validate the command data with Zod
  let validatedData;
  try {
    validatedData = createVoiceSampleSchema.parse({
      audio_url: audioUrl,
      verification_phrase: verificationPhrase,
    });
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

    const response = {
      ...voiceSample,
      message: voiceSample.verified
        ? "Voice sample verified and ready to use! You can now generate personalized stories."
        : "Voice sample created. Verification pending.",
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    logError("Error creating voice sample:", error);

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

      if (error.message === "VERIFICATION_PHRASE_MISMATCH") {
        return new Response(
          JSON.stringify({
            message: "The recorded audio does not match the verification phrase. Please try again.",
          }),
          {
            status: 422,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (error.message === "VOICE_VERIFICATION_ERROR") {
        return new Response(
          JSON.stringify({
            message: "Voice verification failed. Please try recording again in a quiet environment.",
          }),
          {
            status: 422,
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
