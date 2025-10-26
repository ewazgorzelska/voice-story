// src/pages/api/voice-sample/phrase.ts

import type { APIRoute } from "astro";
import type { GetVoiceSamplePhraseResponseDto } from "../../../types";
import { getRandomPhrase } from "../../../lib/services/voiceSampleService";

export const prerender = false;

/**
 * GET /api/voice-sample/phrase
 *
 * Returns a random verification phrase for voice sample recording.
 * This endpoint does not require authentication.
 *
 * @returns 200 - Random verification phrase
 * @returns 500 - Internal server error
 */
export const GET: APIRoute = async () => {
  try {
    const phrase = getRandomPhrase();

    const response: GetVoiceSamplePhraseResponseDto = {
      phrase,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error getting verification phrase:", error);

    return new Response(
      JSON.stringify({
        message: "Failed to retrieve verification phrase",
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
