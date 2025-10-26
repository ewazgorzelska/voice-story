// src/lib/schemas/voiceSampleSchemas.ts

import { z } from "zod";

/**
 * Schema for POST /api/voice-sample
 * Validates audio URL and verification phrase
 */
export const createVoiceSampleSchema = z.object({
  audio_url: z.string().url("Invalid audio URL format").min(1, "Audio URL is required"),
  verification_phrase: z.string().min(1, "Verification phrase is required").max(500, "Verification phrase is too long"),
});

/**
 * Schema for PATCH /api/voice-sample/:id/verify
 * Validates the verified boolean flag
 */
export const verifyVoiceSampleSchema = z.object({
  verified: z.boolean({
    required_error: "Verified field is required",
    invalid_type_error: "Verified must be a boolean",
  }),
});

/**
 * Schema for validating UUID path parameters
 */
export const voiceSampleIdSchema = z.string().uuid("Invalid voice sample ID format");

/**
 * Type exports for use in service layer
 */
export type CreateVoiceSampleInput = z.infer<typeof createVoiceSampleSchema>;
export type VerifyVoiceSampleInput = z.infer<typeof verifyVoiceSampleSchema>;
