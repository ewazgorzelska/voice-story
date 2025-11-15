// src/lib/services/voiceSampleService.ts

import type { SupabaseClient } from "../../db/supabase.client";
import type { VoiceSampleDto, CreateVoiceSampleCommand, VerifyVoiceSampleResponseDto } from "../../types";
import { logError, logInfo } from "@/lib/logger";
import { createVoiceModel, createElevenLabsService } from "./elevenlabsService";

/**
 * List of verification phrases for voice sample recording
 * These phrases are designed to capture a variety of phonemes
 */
const VERIFICATION_PHRASES = [
  "Even the smallest of us can change the whole day simply by showing up with kindness, reminding everyone that gentle hearts often make the biggest difference.",
  "Some days feel heavy, but having a friend who walks beside you can make even the longest path feel lighter and easier to follow.",
  "When you slow down and enjoy the simple things—a warm snack, a cozy corner, a friendly voice—you discover that happiness often hides in plain sight.",
  "Knowing someone cares about you turns ordinary moments into treasures, proving that friendship is one of the most comforting adventures we share.",
  "True bravery isn't loud or grand; it's the small decision to keep going, even when you're unsure, trusting that things will work out in their own gentle way.",
  "Sometimes it's perfectly fine not to know all the answers; wondering and exploring with open curiosity can be its own delightful reward.",
  "A thoughtful companion can turn a gloomy, blustery morning into something bright simply by being there and reminding you that storms always pass.",
  "When you give a little love, it tends to echo back in ways you never expected, proving that kindness stretches farther than we imagine.",
  "You don't need to be extraordinary to matter; just being yourself—with your quirks, hopes, and small joys—is enough to make the world a bit brighter.",
  "Even on confusing days, trust that you're exactly where you need to be, and that each step—no matter how wobbly—carries you toward something meaningful.",
];

/**
 * Returns a random verification phrase for voice recording
 */
export function getRandomPhrase(): string {
  const randomIndex = Math.floor(Math.random() * VERIFICATION_PHRASES.length);
  return VERIFICATION_PHRASES[randomIndex];
}

/**
 * Normalizes text for comparison by removing punctuation and converting to lowercase
 * @param text Text to normalize
 * @returns Normalized text
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:"""„]/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

/**
 * Calculates similarity between two strings using Levenshtein distance
 * @param str1 First string
 * @param str2 Second string
 * @returns Similarity score between 0 and 1
 */
function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);

  if (norm1 === norm2) return 1.0;
  if (norm1.length === 0 || norm2.length === 0) return 0.0;

  // Levenshtein distance algorithm
  const matrix: number[][] = [];

  for (let i = 0; i <= norm2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= norm1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= norm2.length; i++) {
    for (let j = 1; j <= norm1.length; j++) {
      if (norm2.charAt(i - 1) === norm1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  const maxLength = Math.max(norm1.length, norm2.length);
  const distance = matrix[norm2.length][norm1.length];
  return 1 - distance / maxLength;
}

/**
 * Verifies that the transcribed audio matches the expected verification phrase
 * @param audioUrl URL to the audio file
 * @param expectedPhrase The phrase that should have been spoken
 * @returns True if verification passes, false otherwise
 */
async function verifyAudioContent(audioUrl: string, expectedPhrase: string): Promise<boolean> {
  const SIMILARITY_THRESHOLD = 0.8; // 80% similarity required

  try {
    logInfo("Starting voice sample verification", {
      audioUrl,
      expectedPhrase,
    });

    const elevenLabs = createElevenLabsService();
    const transcript = await elevenLabs.speechToText(audioUrl);

    logInfo("Voice sample transcription result", {
      expected: expectedPhrase,
      transcribed: transcript,
      transcriptLength: transcript.length,
    });

    // Check if transcript is empty
    if (!transcript || transcript.trim().length === 0) {
      logError("Voice sample transcription returned empty result", {
        audioUrl,
        expectedPhrase,
      });
      // Return false to reject empty transcriptions
      return false;
    }

    const similarity = calculateSimilarity(transcript, expectedPhrase);

    logInfo("Voice sample similarity score", {
      similarity: similarity.toFixed(3),
      threshold: SIMILARITY_THRESHOLD,
      passed: similarity >= SIMILARITY_THRESHOLD,
      normalized: {
        expected: normalizeText(expectedPhrase),
        transcribed: normalizeText(transcript),
      },
    });

    return similarity >= SIMILARITY_THRESHOLD;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logError("Voice sample verification failed due to technical error", {
      error: errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      audioUrl,
      expectedPhrase,
    });

    // IMPORTANT: Always reject if verification fails for any reason
    // This ensures security - better to require re-recording than accept wrong samples
    throw new Error(`Verification failed: ${errorMessage}`);
  }
}

/**
 * Creates a new voice sample for a user
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user's ID
 * @param command - Voice sample creation data
 * @returns Created voice sample DTO
 * @throws Error if sample already exists or ElevenLabs API fails
 */
export async function createVoiceSample(
  supabase: SupabaseClient,
  userId: string,
  command: CreateVoiceSampleCommand
): Promise<VoiceSampleDto> {
  // Check if user already has a voice sample
  const { data: existingSample, error: checkError } = await supabase
    .from("voice_samples")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (checkError) {
    logError("Error checking existing voice sample:", checkError);
    throw new Error("Failed to check existing voice sample");
  }

  if (existingSample) {
    throw new Error("VOICE_SAMPLE_EXISTS");
  }

  // Verify that the audio matches the verification phrase
  let isVerified = false;
  try {
    isVerified = await verifyAudioContent(command.audio_url, command.verification_phrase);
    if (!isVerified) {
      throw new Error("VERIFICATION_PHRASE_MISMATCH");
    }
  } catch (error) {
    // Re-throw verification mismatch errors (wrong phrase spoken)
    if (error instanceof Error && error.message === "VERIFICATION_PHRASE_MISMATCH") {
      logError("Voice sample verification failed: phrase mismatch", {
        expectedPhrase: command.verification_phrase,
        userId,
      });
      throw error;
    }

    // For any other errors, reject the sample
    logError("Voice sample verification failed due to technical error:", {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    throw new Error("VOICE_VERIFICATION_ERROR");
  }

  // Call ElevenLabs API to create voice model
  let elevenlabsVoiceId: string;
  try {
    elevenlabsVoiceId = await createVoiceModel(command.audio_url, `user_${userId.substring(0, 8)}`);
  } catch (error) {
    logError("ElevenLabs API error:", error);
    throw new Error("VOICE_SERVICE_UNAVAILABLE");
  }

  // Insert new voice sample into database with verification status
  const { data: newSample, error: insertError } = await supabase
    .from("voice_samples")
    .insert({
      user_id: userId,
      elevenlabs_voice_id: elevenlabsVoiceId,
      verification_phrase: command.verification_phrase,
      verified: isVerified,
    })
    .select("id, user_id, created_at, verified")
    .single();

  if (insertError || !newSample) {
    logError("Error inserting voice sample:", insertError);
    throw new Error("Failed to create voice sample");
  }

  return newSample as VoiceSampleDto;
}

/**
 * Deletes a user's voice sample from the database and the ElevenLabs service.
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user's ID
 * @throws Error if the voice sample is not found or if deletion fails.
 */
export async function deleteVoiceSample(supabase: SupabaseClient, userId: string): Promise<void> {
  // 1. Fetch the voice sample to get the elevenlabs_voice_id
  const { data: sample, error: fetchError } = await supabase
    .from("voice_samples")
    .select("id, elevenlabs_voice_id")
    .eq("user_id", userId)
    .single();

  if (fetchError) {
    logError("Error fetching voice sample for deletion:", fetchError);
    throw new Error("Failed to fetch voice sample for deletion");
  }

  if (!sample) {
    throw new Error("VOICE_SAMPLE_NOT_FOUND");
  }

  // 2. Delete the voice from ElevenLabs
  try {
    const elevenLabs = createElevenLabsService();
    await elevenLabs.deleteVoice(sample.elevenlabs_voice_id);
    logInfo("Successfully deleted voice from ElevenLabs", { voiceId: sample.elevenlabs_voice_id });
  } catch (error) {
    logError("Failed to delete voice from ElevenLabs. Continuing with database deletion.", {
      voiceId: sample.elevenlabs_voice_id,
      error: error instanceof Error ? error.message : String(error),
    });
    // We proceed to delete from our DB even if the third-party deletion fails
    // to allow the user to retry the process.
  }

  // 3. Delete the voice sample from the database
  const { error: deleteError } = await supabase.from("voice_samples").delete().eq("id", sample.id);

  if (deleteError) {
    logError("Error deleting voice sample from database:", deleteError);
    throw new Error("Failed to delete voice sample from database");
  }

  logInfo("Successfully deleted voice sample for user", { userId, sampleId: sample.id });
}

/**
 * Verifies a voice sample for a user
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user's ID
 * @param sampleId - Voice sample ID to verify
 * @param verified - Verification status to set
 * @returns Updated voice sample verification status
 * @throws Error if sample not found or user unauthorized
 */
export async function verifyVoiceSample(
  supabase: SupabaseClient,
  userId: string,
  sampleId: string,
  verified: boolean
): Promise<VerifyVoiceSampleResponseDto> {
  // Fetch the voice sample to verify ownership
  const { data: sample, error: fetchError } = await supabase
    .from("voice_samples")
    .select("id, user_id")
    .eq("id", sampleId)
    .maybeSingle();

  if (fetchError) {
    logError("Error fetching voice sample:", fetchError);
    throw new Error("Failed to fetch voice sample");
  }

  if (!sample) {
    throw new Error("VOICE_SAMPLE_NOT_FOUND");
  }

  if (sample.user_id !== userId) {
    throw new Error("VOICE_SAMPLE_UNAUTHORIZED");
  }

  // Update verification status
  const { data: updatedSample, error: updateError } = await supabase
    .from("voice_samples")
    .update({ verified })
    .eq("id", sampleId)
    .select("id, verified")
    .single();

  if (updateError || !updatedSample) {
    logError("Error updating voice sample:", updateError);
    throw new Error("Failed to update voice sample");
  }

  return updatedSample as VerifyVoiceSampleResponseDto;
}
