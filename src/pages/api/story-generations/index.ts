// src/pages/api/story-generations/index.ts

import type { APIRoute } from "astro";
import { logError, logInfo } from "@/lib/logger";
import { InitGenerationSchema, ListGenerationsSchema } from "../../../lib/schemas/storyGenerationSchemas";
import * as storyGenerationService from "../../../lib/services/storyGenerationService";
import { processStoryGeneration } from "@/lib/services/storyGenerationProcessor";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

export const prerender = false;

/**
 * POST /api/story-generations
 * Initiates a new story generation process
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Verify supabase client is available
    if (!locals.supabase) {
      logError("Supabase client not available in locals");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check authentication
    const userId = locals.user?.id || DEFAULT_USER_ID;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      logError("Failed to parse request body:", error);
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validation = InitGenerationSchema.safeParse(body);
    if (!validation.success) {
      logError("Validation failed:", validation.error.errors);
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: validation.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Call service to initiate generation
    try {
      const result = await storyGenerationService.initiate(locals.supabase, userId, validation.data);

      // Trigger background processing asynchronously
      // Don't await - let it run in the background while we return the response
      processStoryGeneration({
        generationId: result.id,
        userId: userId,
        supabase: locals.supabase,
      }).catch((error) => {
        logError("Background story generation processing failed", {
          error,
          generationId: result.id,
          userId,
        });
      });

      logInfo("Story generation initiated", {
        generationId: result.id,
        userId,
        storyId: validation.data.story_id,
      });

      return new Response(JSON.stringify(result), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Handle specific errors
      if (error instanceof Error) {
        if (error.message === "Story not found") {
          return new Response(JSON.stringify({ error: "Story not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        logError("Error initiating story generation:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
      } else {
        logError("Error initiating story generation:", error);
      }

      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    logError("Unexpected error in POST /api/story-generations:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * GET /api/story-generations
 * Lists story generations with pagination and optional status filter
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Check authentication
    const userId = locals.user?.id || DEFAULT_USER_ID;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate query parameters
    const queryParams = {
      page: url.searchParams.get("page") || undefined,
      pageSize: url.searchParams.get("pageSize") || undefined,
      status: url.searchParams.get("status") || undefined,
    };

    const validation = ListGenerationsSchema.safeParse(queryParams);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: validation.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { page, pageSize, status } = validation.data;

    // Call service to list generations
    try {
      const result = await storyGenerationService.list(locals.supabase, userId, page, pageSize, status);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      logError("Error listing story generations:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    logError("Unexpected error in GET /api/story-generations:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
