// src/pages/api/story-generations/[id].ts

import type { APIRoute } from "astro";
import { GetByIdSchema, DeleteGenerationSchema } from "../../../../lib/schemas/storyGenerationSchemas";
import * as storyGenerationService from "../../../../lib/services/storyGenerationService";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";

export const prerender = false;

/**
 * GET /api/story-generations/:id
 * Retrieves the status and result URL of a specific generation
 */
export const GET: APIRoute = async ({ params, locals }) => {
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
    const validation = GetByIdSchema.safeParse({ id: params.id });
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
      if (error instanceof Error && error.message === "Generation not found") {
        return new Response(JSON.stringify({ error: "Generation not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Generic error
      console.error("Error retrieving story generation:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Unexpected error in GET /api/story-generations/:id:", error);
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
    // Check authentication
    const userId = DEFAULT_USER_ID;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate path parameter
    const validation = DeleteGenerationSchema.safeParse({ id: params.id });
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
      }

      // Generic error
      console.error("Error deleting story generation:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Unexpected error in DELETE /api/story-generations/:id:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
