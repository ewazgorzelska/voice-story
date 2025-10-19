// src/pages/api/story-generations/index.ts

import type { APIRoute } from "astro";
import { InitGenerationSchema, ListGenerationsSchema } from "../../../lib/schemas/storyGenerationSchemas";
import * as storyGenerationService from "../../../lib/services/storyGenerationService";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

export const prerender = false;

/**
 * POST /api/story-generations
 * Initiates a new story generation process
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    const userId = DEFAULT_USER_ID;
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
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validation = InitGenerationSchema.safeParse(body);
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

    const { story_id } = validation.data;

    // Call service to initiate generation
    try {
      const result = await storyGenerationService.initiate(locals.supabase, userId, story_id);

      return new Response(JSON.stringify(result), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Handle specific errors
      if (error instanceof Error && error.message === "Story not found") {
        return new Response(JSON.stringify({ error: "Story not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Generic error
      console.error("Error initiating story generation:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/story-generations:", error);
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
    const userId = DEFAULT_USER_ID;
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
      console.error("Error listing story generations:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Unexpected error in GET /api/story-generations:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
