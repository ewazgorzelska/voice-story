-- Migration: Enable public read access to stories table
-- Description: Creates RLS policy to allow anyone to read stories
-- Date: 2025-11-11

-- Enable RLS on stories table
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone (authenticated or anonymous) to read stories
CREATE POLICY "stories_select_public"
ON public.stories
FOR SELECT
TO public
USING (true);

-- Note: Stories remain admin-only for INSERT, UPDATE, DELETE
-- Only SELECT is publicly available

