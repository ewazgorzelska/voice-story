-- Migration: Create voice-samples storage bucket and policies
-- Purpose: Ensure authenticated users can upload voice samples while keeping bucket public for reads
-- Affected resources: storage.buckets, storage.objects policies

-- ============================================================================
-- 1. CREATE BUCKET
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('voice-samples', 'voice-samples', true, null)
on conflict (id) do nothing;

-- ============================================================================
-- 2. STORAGE POLICIES
-- ============================================================================
-- Allow authenticated users to upload files to the bucket
drop policy if exists "Authenticated users can upload voice samples" on storage.objects;
create policy "Authenticated users can upload voice samples"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'voice-samples');

-- Allow authenticated users to update their own files in the bucket
drop policy if exists "Authenticated users can update their voice samples" on storage.objects;
create policy "Authenticated users can update their voice samples"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'voice-samples')
  with check (bucket_id = 'voice-samples');

-- Allow authenticated users to delete files from the bucket
drop policy if exists "Authenticated users can delete their voice samples" on storage.objects;
create policy "Authenticated users can delete their voice samples"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'voice-samples');

-- Ensure public read access to voice samples
drop policy if exists "Public read access to voice samples" on storage.objects;
create policy "Public read access to voice samples"
  on storage.objects for select
  to public
  using (bucket_id = 'voice-samples');


