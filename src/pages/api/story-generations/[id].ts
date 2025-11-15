// src/pages/api/story-generations/[id].ts

import type { APIRoute } from "astro";
import { logError } from "@/lib/logger";
import { GetByIdSchema, DeleteGenerationSchema } from "../../../lib/schemas/storyGenerationSchemas";
import * as storyGenerationService from "../../../lib/services/storyGenerationService";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

export const prerender = false;

/**
 * GET /api/story-generations/:id
 * Retrieves the status and result URL of a specific generation
 */
export const GET: APIRoute = async ({ params, locals }) => {
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

    // Validate path parameter
    if (!params.id) {
      return new Response(JSON.stringify({ error: "Generation ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validation = GetByIdSchema.safeParse({ id: params.id });
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

    const { id } = validation.data;

    // Call service to get generation
    try {
      const result = await storyGenerationService.getById(locals.supabase, userId, id);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Handle specific errors
      if (error instanceof Error) {
        if (error.message === "Generation not found") {
          return new Response(JSON.stringify({ error: "Generation not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        logError("Error retrieving story generation:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
          generationId: id,
        });
      } else {
        logError("Error retrieving story generation:", error);
      }

      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    logError("Unexpected error in GET /api/story-generations/:id:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/story-generations/:id
 * Deletes a specific generation if it is completed or failed
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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

    // Validate path parameter
    if (!params.id) {
      return new Response(JSON.stringify({ error: "Generation ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validation = DeleteGenerationSchema.safeParse({ id: params.id });
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

    const { id } = validation.data;

    // Call service to delete generation
    try {
      await storyGenerationService.remove(locals.supabase, userId, id);

      // Return 204 No Content on successful deletion
      return new Response(null, {
        status: 204,
      });
    } catch (error) {
      // Handle specific errors
      if (error instanceof Error) {
        if (error.message === "Generation not found") {
          return new Response(JSON.stringify({ error: "Generation not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (error.message === "Cannot delete in-progress generation") {
          return new Response(JSON.stringify({ error: "Cannot delete in-progress generation" }), {
            status: 409,
            headers: { "Content-Type": "application/json" },
          });
        }
        logError("Error deleting story generation:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
          generationId: id,
        });
      } else {
        logError("Error deleting story generation:", error);
      }

      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    logError("Unexpected error in DELETE /api/story-generations/:id:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
