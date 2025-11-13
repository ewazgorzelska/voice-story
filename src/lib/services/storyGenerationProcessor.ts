// src/lib/services/storyGenerationProcessor.ts

import type { SupabaseClient } from "../../db/supabase.client";
import { logError, logInfo } from "@/lib/logger";
import { generateStoryContent } from "./storyContentService";
import { createElevenLabsService } from "./elevenlabsService";

/**
 * Story Generation Processor
 * Handles the complete story generation workflow:
 * 1. Generate personalized story content via OpenRouter
 * 2. Generate audio narration via ElevenLabs
 * 3. Update database with progress and results
 */

export interface ProcessGenerationInput {
  /** Generation record ID */
  generationId: string;
  /** User ID */
  userId: string;
  /** Supabase client instance */
  supabase: SupabaseClient;
}

/**
 * Processes a story generation request end-to-end
 * Updates progress in the database throughout the process
 *
 * @param input - Processing parameters
 */
export async function processStoryGeneration(input: ProcessGenerationInput): Promise<void> {
  const { generationId, userId, supabase } = input;

  try {
    logInfo("Starting story generation processing", { generationId, userId });

    // Validate required environment variables
    const openRouterKey = import.meta.env.OPENROUTER_API_KEY;
    const elevenLabsKey = import.meta.env.ELEVENLABS_API_KEY;

    logInfo("Checking environment variables", {
      hasOpenRouterKey: !!openRouterKey,
      hasElevenLabsKey: !!elevenLabsKey,
      openRouterKeyLength: openRouterKey?.length || 0,
      elevenLabsKeyLength: elevenLabsKey?.length || 0,
    });

    if (!openRouterKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }

    if (!elevenLabsKey) {
      throw new Error("ELEVENLABS_API_KEY environment variable is not set");
    }

    // Fetch the generation record with related story data
    const { data: generation, error: fetchError } = await supabase
      .from("story_generations")
      .select(
        `
        id,
        story_id,
        user_id,
        status,
        child_age,
        duration_min_minutes,
        duration_max_minutes,
        stories (
          id,
          title,
          content
        )
      `
      )
      .eq("id", generationId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !generation) {
      throw new Error(`Generation record not found: ${generationId}`);
    }

    // Validate the generation is in a valid state
    if (generation.status !== "pending") {
      logInfo("Generation already processed or in progress", { generationId, status: generation.status });
      return;
    }

    // Extract story data
    const story = Array.isArray(generation.stories) ? generation.stories[0] : generation.stories;
    if (!story) {
      throw new Error(`Story not found for generation: ${generationId}`);
    }

    // Fetch user's verified voice sample
    const { data: voiceSample, error: voiceError } = await supabase
      .from("voice_samples")
      .select("elevenlabs_voice_id")
      .eq("user_id", userId)
      .eq("verified", true)
      .single();

    if (voiceError || !voiceSample) {
      throw new Error("User has no verified voice sample");
    }

    // Update status to in_progress
    await updateGenerationStatus(supabase, generationId, "in_progress", 10);

    // STEP 1: Generate personalized story content via OpenRouter
    logInfo("Generating story content", { generationId, storyId: story.id });

    let contentResult;
    try {
      contentResult = await generateStoryContent({
        storyTitle: story.title,
        storyContent: story.content,
        childAge: generation.child_age,
        durationMinMinutes: generation.duration_min_minutes,
        durationMaxMinutes: generation.duration_max_minutes,
      });
    } catch (contentError) {
      logError("Story content generation failed", {
        error: contentError,
        generationId,
        storyId: story.id,
      });
      throw contentError;
    }

    // Update progress after content generation
    await updateGenerationStatus(supabase, generationId, "in_progress", 40);

    // Store the teaser
    await supabase.from("story_generations").update({ teaser: contentResult.teaser }).eq("id", generationId);

    logInfo("Story content generated successfully", {
      generationId,
      contentLength: contentResult.content.length,
      teaserLength: contentResult.teaser.length,
    });

    // STEP 2: Generate audio narration via ElevenLabs
    logInfo("Generating audio narration", { generationId, voiceId: voiceSample.elevenlabs_voice_id });

    let elevenLabs;
    try {
      elevenLabs = createElevenLabsService();
    } catch (serviceError) {
      logError("Failed to create ElevenLabs service", {
        error: serviceError,
        generationId,
      });
      const errorMessage = serviceError instanceof Error ? serviceError.message : String(serviceError);
      throw new Error(`Failed to initialize ElevenLabs service: ${errorMessage}`);
    }

    let audioResult;
    try {
      audioResult = await elevenLabs.textToSpeech({
        text: contentResult.content,
        voiceId: voiceSample.elevenlabs_voice_id,
        optimize_streaming_latency: 2,
        model_id: "eleven_multilingual_v2",
      });
    } catch (audioError) {
      logError("Audio generation failed", {
        error: audioError,
        generationId,
        voiceId: voiceSample.elevenlabs_voice_id,
      });
      throw audioError;
    }

    // Update progress after audio generation
    await updateGenerationStatus(supabase, generationId, "in_progress", 80);

    logInfo("Audio narration generated successfully", {
      generationId,
      audioSize: audioResult.audio.byteLength,
    });

    // STEP 3: Upload audio to storage
    const audioFileName = `${generationId}.mp3`;
    const audioPath = `${userId}/${audioFileName}`;

    const { error: uploadError } = await supabase.storage.from("story-audio").upload(audioPath, audioResult.audio, {
      contentType: "audio/mpeg",
      upsert: false,
    });

    if (uploadError) {
      logError("Failed to upload audio to storage", { error: uploadError, generationId });
      throw new Error("Failed to upload audio file");
    }

    // Get public URL for the audio file
    const { data: urlData } = supabase.storage.from("story-audio").getPublicUrl(audioPath);

    if (!urlData?.publicUrl) {
      throw new Error("Failed to get public URL for audio file");
    }

    logInfo("Audio uploaded to storage", { generationId, audioPath, publicUrl: urlData.publicUrl });

    // STEP 4: Mark generation as completed
    await supabase
      .from("story_generations")
      .update({
        status: "completed",
        progress: 100,
        result_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", generationId);

    // Log completion event
    await supabase.from("generation_logs").insert({
      generation_id: generationId,
      event: "Generation completed successfully",
      occurred_at: new Date().toISOString(),
    });

    logInfo("Story generation completed successfully", { generationId, resultUrl: urlData.publicUrl });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : "UnknownError";

    logError("Story generation failed", {
      error: errorMessage,
      errorName,
      errorStack,
      generationId,
      userId,
    });

    // Mark generation as failed
    try {
      await updateGenerationStatus(supabase, generationId, "failed", 0);
    } catch (updateError) {
      logError("Failed to update generation status to failed", {
        error: updateError,
        generationId,
      });
    }

    // Log failure event
    try {
      await supabase.from("generation_logs").insert({
        generation_id: generationId,
        event: `Generation failed: ${errorMessage}`,
        occurred_at: new Date().toISOString(),
      });
    } catch (logInsertError) {
      logError("Failed to log generation failure event", {
        error: logInsertError,
        generationId,
      });
    }

    // Don't re-throw - we've already logged and updated the status
    // Re-throwing would cause unhandled promise rejection
  }
}

/**
 * Updates generation status and progress
 */
async function updateGenerationStatus(
  supabase: SupabaseClient,
  generationId: string,
  status: "pending" | "in_progress" | "completed" | "failed",
  progress: number
): Promise<void> {
  const { error } = await supabase
    .from("story_generations")
    .update({
      status,
      progress,
      updated_at: new Date().toISOString(),
    })
    .eq("id", generationId);

  if (error) {
    logError("Failed to update generation status", { error, generationId, status, progress });
  } else {
    logInfo("Generation status updated", { generationId, status, progress });
  }

  // Log status change
  await supabase.from("generation_logs").insert({
    generation_id: generationId,
    event: `Status updated to ${status} (${progress}%)`,
    occurred_at: new Date().toISOString(),
  });
}
