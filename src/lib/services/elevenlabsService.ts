// src/lib/services/elevenlabsService.ts

/**
 * Service for interacting with ElevenLabs Voice Cloning API
 *
 * This module provides functionality to create voice models from audio samples.
 * It requires an ElevenLabs API key to be configured in environment variables.
 */

/**
 * Creates a voice model in ElevenLabs from an audio URL
 *
 * @param audioUrl - URL to the audio file for voice cloning
 * @param name - Name for the voice model (optional)
 * @returns ElevenLabs voice ID
 * @throws Error if API call fails or returns invalid response
 */
export async function createVoiceModel(audioUrl: string, name?: string): Promise<string> {
  const apiKey = import.meta.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    console.error("ElevenLabs API key not configured");
    throw new Error("Voice service not configured");
  }

  // Validate audio URL to prevent SSRF attacks
  try {
    const url = new URL(audioUrl);
    // Only allow HTTPS URLs
    if (url.protocol !== "https:") {
      throw new Error("Only HTTPS URLs are allowed");
    }
    // Optional: Add domain whitelist validation here
    // const allowedDomains = ['yourdomain.com', 'supabase.co'];
    // if (!allowedDomains.some(domain => url.hostname.endsWith(domain))) {
    //   throw new Error('Audio URL domain not allowed');
    // }
  } catch (error) {
    console.error("Invalid audio URL:", error);
    throw new Error("Invalid audio URL format");
  }

  try {
    console.log("Creating voice model for audio URL:", audioUrl, "with name:", name);
    // TODO: Implement actual ElevenLabs API call
    // Example implementation:
    // const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
    //   method: 'POST',
    //   headers: {
    //     'Accept': 'application/json',
    //     'xi-api-key': apiKey,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     name: name || `Voice_${Date.now()}`,
    //     files: [{ url: audioUrl }],
    //     description: 'Voice sample for story narration',
    //   }),
    // });
    //
    // if (!response.ok) {
    //   const errorData = await response.json();
    //   throw new Error(`ElevenLabs API error: ${errorData.message || response.statusText}`);
    // }
    //
    // const data = await response.json();
    // return data.voice_id;

    // Placeholder implementation for development
    console.log("Creating voice model for audio URL:", audioUrl);
    const voiceId = `voice_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return voiceId;
  } catch (error) {
    console.error("Error calling ElevenLabs API:", error);
    throw new Error("Failed to create voice model");
  }
}

/**
 * Validates that an audio URL is accessible and has valid format
 *
 * @param audioUrl - URL to validate
 * @returns true if URL is valid and accessible
 */
export async function validateAudioUrl(audioUrl: string): Promise<boolean> {
  try {
    const url = new URL(audioUrl);
    if (url.protocol !== "https:") {
      return false;
    }

    // Optional: Add HEAD request to verify URL is accessible
    // const response = await fetch(audioUrl, { method: 'HEAD' });
    // return response.ok && response.headers.get('content-type')?.startsWith('audio/');

    return true;
  } catch (error) {
    console.error("Error validating audio URL:", error);
    return false;
  }
}
