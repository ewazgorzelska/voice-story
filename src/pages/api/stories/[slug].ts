// src/pages/api/stories/[slug].ts

import type { APIRoute } from "astro";
import { GetStoryBySlugParamsSchema } from "../../../lib/schemas/storySchemas";
import { getStoryBySlug } from "../../../lib/services/storyService";
import type { StoryDto } from "../../../types";

export const prerender = false;

/**
 * GET /api/stories/:slug
 * Returns full details of a story by slug
 * Public endpoint - no authentication required
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Validate path parameter
    const parseResult = GetStoryBySlugParamsSchema.safeParse({
      slug: params.slug,
    });

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid slug parameter",
          details: parseResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { slug } = parseResult.data;

    // Retrieve story from service layer
    const story = await getStoryBySlug(locals.supabase, slug);

    // Handle not found case
    if (!story) {
      return new Response(
        JSON.stringify({
          error: "Story not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Format response
    const response: StoryDto = story;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/stories/:slug] Unhandled error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
