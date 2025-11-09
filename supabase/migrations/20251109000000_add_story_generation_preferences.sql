-- ============================================================================
-- Migration: Add story generation preference fields and teaser support
-- Created:   2025-11-09
-- Description:
--   - Add teaser column to store generated story summaries
--   - Store required user preference inputs (child age, duration range)
--   - Store optional motif prompt with length constraint
--   - Enforce validation constraints for new fields
-- ============================================================================

-- Add new columns with temporary defaults to backfill existing rows
alter table public.story_generations
  add column if not exists teaser text not null default '',
  add column if not exists child_age smallint not null default 5,
  add column if not exists duration_min_minutes smallint not null default 5,
  add column if not exists duration_max_minutes smallint not null default 10,
  add column if not exists motif_prompt text;

-- Ensure motif_prompt values longer than 200 characters are truncated to 200
update public.story_generations
set motif_prompt = left(motif_prompt, 200)
where motif_prompt is not null
  and char_length(motif_prompt) > 200;

-- Add or replace duration bounds constraint
alter table public.story_generations
  drop constraint if exists story_generations_duration_bounds_check,
  add constraint story_generations_duration_bounds_check
    check (
      duration_min_minutes between 1 and 60
      and duration_max_minutes between 1 and 60
    );

-- Add or replace duration ordering constraint
alter table public.story_generations
  drop constraint if exists story_generations_duration_order_check,
  add constraint story_generations_duration_order_check
    check (duration_max_minutes > duration_min_minutes);

-- Add motif prompt length constraint
alter table public.story_generations
  drop constraint if exists story_generations_motif_prompt_length_check,
  add constraint story_generations_motif_prompt_length_check
    check (
      motif_prompt is null
      or char_length(motif_prompt) <= 200
    );

-- Add child age bounds constraint
alter table public.story_generations
  drop constraint if exists story_generations_child_age_check,
  add constraint story_generations_child_age_check
    check (child_age between 0 and 18);

-- Remove temporary defaults to require explicit values going forward
alter table public.story_generations
  alter column child_age drop default,
  alter column duration_min_minutes drop default,
  alter column duration_max_minutes drop default;

-- Keep teaser default empty string for pending generations
-- No action needed; default retained intentionally.

