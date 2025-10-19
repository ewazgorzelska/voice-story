-- Migration: Initial Schema Setup
-- Purpose: Create core tables, enums, indexes, and RLS policies for the voice-story application
-- Affected tables: profiles, voice_samples, stories, story_generations, generation_logs
-- Special considerations: Enables RLS on all tables with granular policies for anon and authenticated roles

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

-- enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- ============================================================================
-- 2. CUSTOM TYPES
-- ============================================================================

-- custom enum for tracking story generation status
create type generation_status as enum ('pending', 'in_progress', 'completed', 'failed');

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- profiles table: stores additional user metadata beyond auth.users
-- 1:1 relationship with auth.users
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
  -- future columns: display_name, avatar_url, etc.
);

-- enable row level security on profiles
alter table profiles enable row level security;

-- voice_samples table: stores user voice samples for ElevenLabs integration
-- each user can have one voice sample (enforced by unique constraint)
create table voice_samples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  elevenlabs_voice_id text not null,
  verification_phrase text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  -- ensure one voice sample per user
  unique (user_id)
);

-- enable row level security on voice_samples
alter table voice_samples enable row level security;

-- stories table: stores story content that can be generated into audio
-- stories are versioned and accessed via slugs
create table stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

-- enable row level security on stories
alter table stories enable row level security;

-- story_generations table: tracks user requests to generate audio from stories
-- stores generation status, progress, and result metadata
create table story_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id uuid not null references stories(id) on delete cascade,
  status generation_status not null default 'pending',
  progress integer not null default 0 check (progress between 0 and 100),
  result_url text not null default '',
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- enable row level security on story_generations
alter table story_generations enable row level security;

-- generation_logs table: audit log for generation events
-- tracks detailed events during the generation process
create table generation_logs (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references story_generations(id) on delete cascade,
  event text not null,
  occurred_at timestamptz not null default now()
);

-- enable row level security on generation_logs
alter table generation_logs enable row level security;

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

-- index for looking up voice samples by user
create index idx_voice_samples_user_id on voice_samples(user_id);

-- index for looking up story generations by user
create index idx_story_generations_user_id on story_generations(user_id);

-- index for looking up story generations by story
create index idx_story_generations_story_id on story_generations(story_id);

-- index for looking up generation logs by generation
create index idx_generation_logs_generation_id on generation_logs(generation_id);

-- note: jsonb/gin indexing on story_generations.metadata deferred until query patterns emerge

-- ============================================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- profiles policies
-- ----------------

-- anon users cannot select profiles
create policy profiles_select_anon on profiles
  for select
  to anon
  using (false);

-- authenticated users can select their own profile
create policy profiles_select_authenticated on profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

-- anon users cannot insert profiles
create policy profiles_insert_anon on profiles
  for insert
  to anon
  with check (false);

-- authenticated users can insert their own profile
create policy profiles_insert_authenticated on profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- anon users cannot update profiles
create policy profiles_update_anon on profiles
  for update
  to anon
  using (false)
  with check (false);

-- authenticated users can update their own profile
create policy profiles_update_authenticated on profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- anon users cannot delete profiles
create policy profiles_delete_anon on profiles
  for delete
  to anon
  using (false);

-- authenticated users can delete their own profile
create policy profiles_delete_authenticated on profiles
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- voice_samples policies
-- ----------------------

-- anon users cannot select voice samples
create policy voice_samples_select_anon on voice_samples
  for select
  to anon
  using (false);

-- authenticated users can select their own voice samples
create policy voice_samples_select_authenticated on voice_samples
  for select
  to authenticated
  using (auth.uid() = user_id);

-- anon users cannot insert voice samples
create policy voice_samples_insert_anon on voice_samples
  for insert
  to anon
  with check (false);

-- authenticated users can insert their own voice samples
create policy voice_samples_insert_authenticated on voice_samples
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- anon users cannot update voice samples
create policy voice_samples_update_anon on voice_samples
  for update
  to anon
  using (false)
  with check (false);

-- authenticated users can update their own voice samples
create policy voice_samples_update_authenticated on voice_samples
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- anon users cannot delete voice samples
create policy voice_samples_delete_anon on voice_samples
  for delete
  to anon
  using (false);

-- authenticated users can delete their own voice samples
create policy voice_samples_delete_authenticated on voice_samples
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- stories policies
-- ---------------
-- stories are publicly readable but not modifiable by users (admin-managed content)

-- anon users can select all stories (public access)
create policy stories_select_anon on stories
  for select
  to anon
  using (true);

-- authenticated users can select all stories (public access)
create policy stories_select_authenticated on stories
  for select
  to authenticated
  using (true);

-- anon users cannot insert stories
create policy stories_insert_anon on stories
  for insert
  to anon
  with check (false);

-- authenticated users cannot insert stories (admin-only)
create policy stories_insert_authenticated on stories
  for insert
  to authenticated
  with check (false);

-- anon users cannot update stories
create policy stories_update_anon on stories
  for update
  to anon
  using (false)
  with check (false);

-- authenticated users cannot update stories (admin-only)
create policy stories_update_authenticated on stories
  for update
  to authenticated
  using (false)
  with check (false);

-- anon users cannot delete stories
create policy stories_delete_anon on stories
  for delete
  to anon
  using (false);

-- authenticated users cannot delete stories (admin-only)
create policy stories_delete_authenticated on stories
  for delete
  to authenticated
  using (false);

-- story_generations policies
-- --------------------------

-- anon users cannot select story generations
create policy story_generations_select_anon on story_generations
  for select
  to anon
  using (false);

-- authenticated users can select their own story generations
create policy story_generations_select_authenticated on story_generations
  for select
  to authenticated
  using (auth.uid() = user_id);

-- anon users cannot insert story generations
create policy story_generations_insert_anon on story_generations
  for insert
  to anon
  with check (false);

-- authenticated users can insert their own story generations
create policy story_generations_insert_authenticated on story_generations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- anon users cannot update story generations
create policy story_generations_update_anon on story_generations
  for update
  to anon
  using (false)
  with check (false);

-- authenticated users can update their own story generations
create policy story_generations_update_authenticated on story_generations
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- anon users cannot delete story generations
create policy story_generations_delete_anon on story_generations
  for delete
  to anon
  using (false);

-- authenticated users can delete their own story generations
create policy story_generations_delete_authenticated on story_generations
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- generation_logs policies
-- ------------------------
-- users can only access logs for their own generations

-- anon users cannot select generation logs
create policy generation_logs_select_anon on generation_logs
  for select
  to anon
  using (false);

-- authenticated users can select logs for their own generations
create policy generation_logs_select_authenticated on generation_logs
  for select
  to authenticated
  using (
    exists (
      select 1 from story_generations sg
      where sg.id = generation_logs.generation_id
        and sg.user_id = auth.uid()
    )
  );

-- anon users cannot insert generation logs
create policy generation_logs_insert_anon on generation_logs
  for insert
  to anon
  with check (false);

-- authenticated users can insert logs for their own generations
create policy generation_logs_insert_authenticated on generation_logs
  for insert
  to authenticated
  with check (
    exists (
      select 1 from story_generations sg
      where sg.id = generation_logs.generation_id
        and sg.user_id = auth.uid()
    )
  );

-- anon users cannot update generation logs
create policy generation_logs_update_anon on generation_logs
  for update
  to anon
  using (false)
  with check (false);

-- authenticated users can update logs for their own generations
create policy generation_logs_update_authenticated on generation_logs
  for update
  to authenticated
  using (
    exists (
      select 1 from story_generations sg
      where sg.id = generation_logs.generation_id
        and sg.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from story_generations sg
      where sg.id = generation_logs.generation_id
        and sg.user_id = auth.uid()
    )
  );

-- anon users cannot delete generation logs
create policy generation_logs_delete_anon on generation_logs
  for delete
  to anon
  using (false);

-- authenticated users can delete logs for their own generations
create policy generation_logs_delete_authenticated on generation_logs
  for delete
  to authenticated
  using (
    exists (
      select 1 from story_generations sg
      where sg.id = generation_logs.generation_id
        and sg.user_id = auth.uid()
    )
  );

