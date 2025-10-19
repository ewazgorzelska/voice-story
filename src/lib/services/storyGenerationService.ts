// src/lib/services/storyGenerationService.ts

import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateStoryGenerationResponseDto, StoryGenerationDto, GetStoryGenerationsResponseDto } from "../../types";

/**
 * Story Generation Service
 * Handles business logic for story generation operations
 */

/**
 * Initiates a new story generation process
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - ID of the authenticated user
 * @param storyId - ID of the story to generate
 * @returns Newly created generation record
 * @throws Error if story doesn't exist or user doesn't have access
 */
export async function initiate(
  supabase: SupabaseClient,
  userId: string,
  storyId: string
): Promise<CreateStoryGenerationResponseDto> {
  // First, verify the story exists and is accessible
  const { data: story, error: storyError } = await supabase.from("stories").select("id").eq("id", storyId).single();

  if (storyError || !story) {
    throw new Error("Story not found");
  }

  // Insert new generation record
  const { data: generation, error: insertError } = await supabase
    .from("story_generations")
    .insert({
      user_id: userId,
      story_id: storyId,
      status: "pending",
      progress: 0,
    })
    .select("id, status, progress")
    .single();

  if (insertError || !generation) {
    console.error("Failed to create story generation:", insertError);
    throw new Error("Failed to create story generation");
  }

  // TODO: Enqueue background job for processing
  // This would typically involve sending a message to a queue service

  return {
    id: generation.id,
    status: generation.status,
    progress: generation.progress,
  };
}

/**
 * Lists story generations for a user with pagination and optional status filter
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - ID of the authenticated user
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @param status - Optional status filter
 * @returns Paginated list of generations
 */
export async function list(
  supabase: SupabaseClient,
  userId: string,
  page: number,
  pageSize: number,
  status?: "pending" | "in_progress" | "completed" | "failed"
): Promise<GetStoryGenerationsResponseDto> {
  // Calculate offset for pagination
  const offset = (page - 1) * pageSize;

  // Build query
  let query = supabase
    .from("story_generations")
    .select("id, story_id, status, progress, result_url", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  // Apply status filter if provided
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Failed to list story generations:", error);
    throw new Error("Failed to list story generations");
  }

  return {
    data: (data || []).map((gen) => ({
      id: gen.id,
      story_id: gen.story_id,
      status: gen.status,
      progress: gen.progress,
      result_url: gen.result_url,
    })),
    meta: {
      page,
      page_size: pageSize,
      total: count || 0,
    },
  };
}

/**
 * Retrieves a single story generation by ID
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - ID of the authenticated user
 * @param generationId - ID of the generation to retrieve
 * @returns Generation details
 * @throws Error if generation not found or user doesn't have access
 */
export async function getById(
  supabase: SupabaseClient,
  userId: string,
  generationId: string
): Promise<StoryGenerationDto> {
  const { data, error } = await supabase
    .from("story_generations")
    .select("id, story_id, status, progress, result_url")
    .eq("id", generationId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error("Generation not found");
  }

  return {
    id: data.id,
    story_id: data.story_id,
    status: data.status,
    progress: data.progress,
    result_url: data.result_url,
  };
}

/**
 * Deletes a story generation
 * Only allows deletion if generation is completed or failed
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - ID of the authenticated user
 * @param generationId - ID of the generation to delete
 * @throws Error if generation not found, in progress, or user doesn't have access
 */
export async function remove(supabase: SupabaseClient, userId: string, generationId: string): Promise<void> {
  // First, check the generation exists and get its status
  const { data: generation, error: fetchError } = await supabase
    .from("story_generations")
    .select("status")
    .eq("id", generationId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !generation) {
    throw new Error("Generation not found");
  }

  // Prevent deletion of in-progress generations
  if (generation.status === "in_progress") {
    throw new Error("Cannot delete in-progress generation");
  }

  // Delete the generation
  const { error: deleteError } = await supabase
    .from("story_generations")
    .delete()
    .eq("id", generationId)
    .eq("user_id", userId);

  if (deleteError) {
    console.error("Failed to delete story generation:", deleteError);
    throw new Error("Failed to delete story generation");
  }
}
