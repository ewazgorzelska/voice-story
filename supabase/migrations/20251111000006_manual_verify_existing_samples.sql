-- Migration: Manually verify existing voice samples (temporary workaround)
-- Date: 2025-11-11
-- Description: This migration manually verifies existing voice samples that were created
-- before the automatic speech-to-text verification was implemented.
-- 
-- NOTE: This is a one-time migration for existing data. New voice samples will be 
-- automatically verified using speech-to-text comparison.
--
-- IMPORTANT: Only run this after confirming that existing voice samples are legitimate.

-- Update existing voice samples to verified=true
-- Only update samples that:
-- 1. Are currently unverified (verified = false)
-- 2. Have a valid ElevenLabs voice ID
-- 3. Have a verification phrase
UPDATE voice_samples
SET verified = true
WHERE verified = false
  AND elevenlabs_voice_id IS NOT NULL
  AND elevenlabs_voice_id != ''
  AND verification_phrase IS NOT NULL
  AND verification_phrase != '';

-- Add a comment documenting the verification process
COMMENT ON COLUMN voice_samples.verified IS 'Indicates if the voice sample has been verified. New samples are verified automatically using speech-to-text comparison. This migration manually verified pre-existing samples.';

