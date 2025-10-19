-- Migration: Disable All RLS Policies and RLS on Tables
-- Purpose: Drop all RLS policies and disable RLS on tables from the initial schema migration
-- Affected tables: profiles, voice_samples, stories, story_generations, generation_logs
-- Note: This completely disables row level security on all tables

-- ============================================================================
-- DROP ALL RLS POLICIES
-- ============================================================================

-- profiles policies
-- ----------------
drop policy if exists profiles_select_anon on profiles;
drop policy if exists profiles_select_authenticated on profiles;
drop policy if exists profiles_insert_anon on profiles;
drop policy if exists profiles_insert_authenticated on profiles;
drop policy if exists profiles_update_anon on profiles;
drop policy if exists profiles_update_authenticated on profiles;
drop policy if exists profiles_delete_anon on profiles;
drop policy if exists profiles_delete_authenticated on profiles;

-- voice_samples policies
-- ----------------------
drop policy if exists voice_samples_select_anon on voice_samples;
drop policy if exists voice_samples_select_authenticated on voice_samples;
drop policy if exists voice_samples_insert_anon on voice_samples;
drop policy if exists voice_samples_insert_authenticated on voice_samples;
drop policy if exists voice_samples_update_anon on voice_samples;
drop policy if exists voice_samples_update_authenticated on voice_samples;
drop policy if exists voice_samples_delete_anon on voice_samples;
drop policy if exists voice_samples_delete_authenticated on voice_samples;

-- stories policies
-- ---------------
drop policy if exists stories_select_anon on stories;
drop policy if exists stories_select_authenticated on stories;
drop policy if exists stories_insert_anon on stories;
drop policy if exists stories_insert_authenticated on stories;
drop policy if exists stories_update_anon on stories;
drop policy if exists stories_update_authenticated on stories;
drop policy if exists stories_delete_anon on stories;
drop policy if exists stories_delete_authenticated on stories;

-- story_generations policies
-- --------------------------
drop policy if exists story_generations_select_anon on story_generations;
drop policy if exists story_generations_select_authenticated on story_generations;
drop policy if exists story_generations_insert_anon on story_generations;
drop policy if exists story_generations_insert_authenticated on story_generations;
drop policy if exists story_generations_update_anon on story_generations;
drop policy if exists story_generations_update_authenticated on story_generations;
drop policy if exists story_generations_delete_anon on story_generations;
drop policy if exists story_generations_delete_authenticated on story_generations;

-- generation_logs policies
-- ------------------------
drop policy if exists generation_logs_select_anon on generation_logs;
drop policy if exists generation_logs_select_authenticated on generation_logs;
drop policy if exists generation_logs_insert_anon on generation_logs;
drop policy if exists generation_logs_insert_authenticated on generation_logs;
drop policy if exists generation_logs_update_anon on generation_logs;
drop policy if exists generation_logs_update_authenticated on generation_logs;
drop policy if exists generation_logs_delete_anon on generation_logs;
drop policy if exists generation_logs_delete_authenticated on generation_logs;

-- ============================================================================
-- DISABLE RLS ON ALL TABLES
-- ============================================================================

alter table profiles disable row level security;
alter table voice_samples disable row level security;
alter table stories disable row level security;
alter table story_generations disable row level security;
alter table generation_logs disable row level security;

