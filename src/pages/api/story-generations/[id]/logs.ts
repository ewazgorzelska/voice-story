// src/pages/api/story-generations/[id]/logs.ts

import type { APIRoute } from "astro";
import { GetLogsSchema, GetLogsQuerySchema } from "../../../../lib/schemas/storyGenerationSchemas";
import * as generationLogService from "../../../../lib/services/generationLogService";
import * as storyGenerationService from "../../../../lib/services/storyGenerationService";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";

export const prerender = false;

/**
 * GET /api/story-generations/:id/logs
 * Retrieves event logs for a specific story generation with pagination support
 *
 * Query Parameters:
 * - page (optional): Page number, defaults to 1
 * - pageSize (optional): Items per page, defaults to 50, max 100
 */
export const GET: APIRoute = async ({ params, url, locals }) => {
  try {
    // Check authentication
    const userId = DEFAULT_USER_ID;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate path parameter
    const validation = GetLogsSchema.safeParse({ id: params.id });
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid generation id",
          details: validation.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { id } = validation.data;

    // Validate query parameters for pagination
    const queryValidation = GetLogsQuerySchema.safeParse({
      page: url.searchParams.get("page") || undefined,
      pageSize: url.searchParams.get("pageSize") || undefined,
    });

    if (!queryValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          details: queryValidation.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { page, pageSize } = queryValidation.data;

    // Verify the generation exists and belongs to the user
    try {
      await storyGenerationService.getById(locals.supabase, userId, id);
    } catch (error) {
      // If generation not found or doesn't belong to user, return 404
      if (error instanceof Error && error.message === "Generation not found") {
        return new Response(JSON.stringify({ error: "Generation not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error; // Re-throw unexpected errors
    }

    // Fetch logs for the generation with pagination
    try {
      const result = await generationLogService.getLogsByGenerationId(locals.supabase, id, page, pageSize);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Handle service errors
      console.error("Error fetching generation logs:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Unexpected error in GET /api/story-generations/:id/logs:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
