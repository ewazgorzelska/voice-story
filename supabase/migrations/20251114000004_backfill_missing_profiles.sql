-- Migration: Backfill Missing Profiles
-- Purpose: Create profiles for existing users who registered before the trigger was added
-- This is a one-time migration to ensure all users have a profile record

INSERT INTO public.profiles (user_id, voice_cloning_consent_given)
SELECT 
  au.id,
  FALSE
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

