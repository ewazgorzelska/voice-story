// src/lib/services/storyService.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type { StorySummaryDto, StoryDto, PaginationMetaDto } from "../../types";

/**
 * Service layer for Story Library operations
 * Handles data retrieval from the stories table
 */

/**
 * Retrieves a paginated list of story summaries
 * @param supabase - Supabase client instance
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @param sort - Sort order: "asc" or "desc"
 * @returns Object containing story summaries and pagination metadata
 */
export async function getStories(
  supabase: SupabaseClient,
  page: number,
  pageSize: number,
  sort: "asc" | "desc"
): Promise<{ data: StorySummaryDto[]; meta: PaginationMetaDto }> {
  // Calculate range for pagination (Supabase uses 0-indexed ranges)
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Fetch total count for pagination metadata
  const { count, error: countError } = await supabase.from("stories").select("*", { count: "exact", head: true });

  if (countError) {
    console.error("[storyService.getStories] Failed to count stories:", countError);
    throw new Error("Failed to retrieve story count");
  }

  const total = count ?? 0;

  // Fetch paginated story summaries
  const { data, error } = await supabase
    .from("stories")
    .select("id, title, slug")
    .order("title", { ascending: sort === "asc" })
    .range(from, to);

  if (error) {
    console.error("[storyService.getStories] Failed to fetch stories:", error);
    throw new Error("Failed to retrieve stories");
  }

  return {
    data: data ?? [],
    meta: {
      page,
      page_size: pageSize,
      total,
    },
  };
}

/**
 * Retrieves a single story by its slug
 * @param supabase - Supabase client instance
 * @param slug - Unique story slug
 * @returns Story details or null if not found
 */
export async function getStoryBySlug(supabase: SupabaseClient, slug: string): Promise<StoryDto | null> {
  const { data, error } = await supabase.from("stories").select("id, title, slug, content").eq("slug", slug).single();

  if (error) {
    // PGRST116 is Supabase's error code for "no rows returned"
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("[storyService.getStoryBySlug] Failed to fetch story:", error);
    throw new Error("Failed to retrieve story");
  }

  return data;
}
