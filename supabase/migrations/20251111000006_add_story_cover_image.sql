-- Migration: Add cover image fields to stories
-- Description: Adds columns to store user-uploaded cover image metadata for each story
-- Date: 2025-11-11

-- Add columns for cover image metadata
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS cover_image_path text,
  ADD COLUMN IF NOT EXISTS cover_image_mime text,
  ADD COLUMN IF NOT EXISTS cover_image_width integer CHECK (cover_image_width IS NULL OR cover_image_width > 0),
  ADD COLUMN IF NOT EXISTS cover_image_height integer CHECK (cover_image_height IS NULL OR cover_image_height > 0),
  ADD COLUMN IF NOT EXISTS cover_image_alt text,
  ADD COLUMN IF NOT EXISTS cover_image_uploaded_by uuid REFERENCES auth.users(id);

COMMENT ON COLUMN public.stories.cover_image_url IS 'Public URL of the cover image (can be Supabase Storage URL or external URL)';
COMMENT ON COLUMN public.stories.cover_image_path IS 'Path in Supabase Storage (bucket: story-covers) for the cover image';
COMMENT ON COLUMN public.stories.cover_image_mime IS 'MIME type of the cover image (e.g., image/png)';
COMMENT ON COLUMN public.stories.cover_image_width IS 'Pixel width of the cover image';
COMMENT ON COLUMN public.stories.cover_image_height IS 'Pixel height of the cover image';
COMMENT ON COLUMN public.stories.cover_image_alt IS 'Accessible alt text for the cover image';
COMMENT ON COLUMN public.stories.cover_image_uploaded_by IS 'auth.users.id of the user who uploaded the cover image';



