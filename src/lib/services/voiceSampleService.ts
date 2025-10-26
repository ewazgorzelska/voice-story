// src/lib/services/voiceSampleService.ts

import type { SupabaseClient } from "../../db/supabase.client";
import type { VoiceSampleDto, CreateVoiceSampleCommand, VerifyVoiceSampleResponseDto } from "../../types";
import { createVoiceModel } from "./elevenlabsService";

/**
 * List of verification phrases for voice sample recording
 * These phrases are designed to capture a variety of phonemes
 */
const VERIFICATION_PHRASES = [
  "Jestem misiem o bardzo małym rozumku.",
  "Im bardziej Puchatek zaglądał do środka, tym bardziej Prosiaczka tam nie było.",
  "Czy mógłbyś podać mi trochę miodu?",
  "Dzień bez przyjaciela to jak garnek bez kropli miodu.",
  "Obietnice się nie liczą, jeśli ktoś nie zamierza ich dotrzymać.",
  "Najlepiej jest tam, gdzie nas nie ma.",
  "Prosiaczku, czy masz może coś do jedzenia?",
  "Zawsze warto poczekać na przyjaciela.",
];

/**
 * Returns a random verification phrase for voice recording
 */
export function getRandomPhrase(): string {
  const randomIndex = Math.floor(Math.random() * VERIFICATION_PHRASES.length);
  return VERIFICATION_PHRASES[randomIndex];
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
    console.error("Error checking existing voice sample:", checkError);
    throw new Error("Failed to check existing voice sample");
  }

  if (existingSample) {
    throw new Error("VOICE_SAMPLE_EXISTS");
  }

  // Call ElevenLabs API to create voice model
  let elevenlabsVoiceId: string;
  try {
    elevenlabsVoiceId = await createVoiceModel(command.audio_url, `user_${userId.substring(0, 8)}`);
  } catch (error) {
    console.error("ElevenLabs API error:", error);
    throw new Error("VOICE_SERVICE_UNAVAILABLE");
  }

  // Insert new voice sample into database
  const { data: newSample, error: insertError } = await supabase
    .from("voice_samples")
    .insert({
      user_id: userId,
      elevenlabs_voice_id: elevenlabsVoiceId,
      verification_phrase: command.verification_phrase,
      verified: false,
    })
    .select("id, user_id, created_at, verified")
    .single();

  if (insertError || !newSample) {
    console.error("Error inserting voice sample:", insertError);
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
    console.error("Error fetching voice sample:", fetchError);
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
    console.error("Error updating voice sample:", updateError);
    throw new Error("Failed to update voice sample");
  }

  return updatedSample as VerifyVoiceSampleResponseDto;
}
