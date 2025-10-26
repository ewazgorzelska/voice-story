// src/pages/api/stories/index.ts

import type { APIRoute } from "astro";
import { GetStoriesQuerySchema } from "../../../lib/schemas/storySchemas";
import { getStories } from "../../../lib/services/storyService";
import type { GetStoriesResponseDto } from "../../../types";

export const prerender = false;

/**
 * GET /api/stories
 * Returns a paginated list of story summaries
 * Public endpoint - no authentication required
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Extract query parameters
    const page = url.searchParams.get("page") ?? undefined;
    const pageSize = url.searchParams.get("pageSize") ?? undefined;
    const sort = url.searchParams.get("sort") ?? undefined;

    // Validate query parameters
    const parseResult = GetStoriesQuerySchema.safeParse({
      page,
      pageSize,
      sort,
    });

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          details: parseResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { page: validPage, pageSize: validPageSize, sort: validSort } = parseResult.data;

    // Retrieve stories from service layer
    const result = await getStories(locals.supabase, validPage, validPageSize, validSort);

    // Format response
    const response: GetStoriesResponseDto = {
      data: result.data,
      meta: result.meta,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/stories] Unhandled error:", error);
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
