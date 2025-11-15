-- Migration: Fix public access to stories table
-- Description: Drops the restrictive authenticated-only policy and ensures public read access
-- Date: 2025-11-14
-- Affected tables: stories

-- Drop the restrictive policy that only allows authenticated users
DROP POLICY IF EXISTS "Allow authenticated users read-only access to stories." ON public.stories;

-- Ensure the public access policy exists
-- This allows both authenticated and anonymous users to read stories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'stories' 
    AND policyname = 'stories_select_public'
  ) THEN
    CREATE POLICY "stories_select_public"
    ON public.stories
    FOR SELECT
    TO public
    USING (true);
  END IF;
END
$$;

COMMENT ON POLICY "stories_select_public" ON public.stories IS 'Allow anyone (authenticated or anonymous) to read stories from the library';

