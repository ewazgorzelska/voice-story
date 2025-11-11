-- Migration: Create story-audio storage bucket
-- Description: Creates a storage bucket for generated story audio files
-- Date: 2025-11-11

-- Create storage bucket for story audio files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'story-audio',
  'story-audio',
  true,  -- Public bucket for easy access to audio files
  52428800,  -- 50MB file size limit
  array['audio/mpeg', 'audio/mp3']  -- Only allow MP3 audio files
)
on conflict (id) do nothing;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Policy: Allow authenticated users to upload their own audio files
create policy "Users can upload their own story audio"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'story-audio' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own audio files
create policy "Users can update their own story audio"
on storage.objects for update
to authenticated
using (
  bucket_id = 'story-audio' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own audio files
create policy "Users can delete their own story audio"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'story-audio' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow everyone to view audio files (public bucket)
create policy "Anyone can view story audio"
on storage.objects for select
to public
using (bucket_id = 'story-audio');

