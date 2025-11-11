// src/pages/api/story-generations/process.ts

import type { APIRoute } from "astro";
import { logError, logInfo } from "@/lib/logger";
import { processStoryGeneration } from "@/lib/services/storyGenerationProcessor";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

export const prerender = false;

/**
 * POST /api/story-generations/process
 * Internal endpoint to trigger story generation processing
 * This would typically be called by a background job system or webhook
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    let body: { generation_id?: string; user_id?: string };
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { generation_id, user_id } = body;

    // Validate inputs
    if (!generation_id || typeof generation_id !== "string") {
      return new Response(JSON.stringify({ error: "generation_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const effectiveUserId = user_id || DEFAULT_USER_ID;
    if (!effectiveUserId) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    logInfo("Processing story generation request", { generation_id, user_id: effectiveUserId });

    // Process the generation asynchronously
    // In production, this should be handled by a proper job queue
    // For MVP, we'll process it directly but not wait for completion
    processStoryGeneration({
      generationId: generation_id,
      userId: effectiveUserId,
      supabase: locals.supabase,
    }).catch((error) => {
      logError("Background story generation processing failed", { error, generation_id });
    });

    return new Response(
      JSON.stringify({
        message: "Story generation processing started",
        generation_id,
      }),
      {
        status: 202,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logError("Unexpected error in POST /api/story-generations/process:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

