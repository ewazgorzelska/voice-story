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
  "Wiewiórka Weronika i żaba Żaneta grały w berka, zwinne i szybkie, pojawiały się i znikały między krzakami jak kolorowe błyski. Jeleń Julian ćwiczył równowagę, stąpając po kłodach.",
  "Sometimes the smallest things take up the most room in your heart, and honey always tastes better when you share it with friends who truly understand the simple joys of life in the Hundred Acre Wood.",
  "When you wake up in the morning and think of something that makes you happy, that's going to be the very best day of all, filled with wonderful adventures and perhaps a smackerel of honey or two.",
  "There's nothing better than a long walk through the forest with a friend who understands you without words and shares every moment with you, exploring the wonders of nature and discovering new places together.",
  "A true friendship isn't about counting the days we spent together, but making every single day count and special in its own way, creating memories that will last forever in our hearts.",
  "You are braver than you believe, stronger than you seem, smarter than you think, and most importantly, you are loved more than you know by all the friends who cherish your presence in their lives.",
  "Even if we are apart, we will always be together, because true friends are never far away from each other in their hearts, no matter how many miles or forests may lie between them.",
  "Sometimes you just need to sit next to someone in silence, because the most important things are said without words, from the heart, and that's when you know you've found a friend for life.",
  "A day spent with Piglet, Tigger, and Eeyore is always a day full of adventures, laughter, and unforgettable moments in the Hundred Acre Wood, where every corner holds a new surprise and every friend brings their own special magic.",
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
