-- Migration: Add composite index for generation_logs queries
-- Purpose: Optimize queries that filter by generation_id and order by occurred_at
-- Date: 2025-10-26

-- Drop the existing single-column index on generation_id
drop index if exists idx_generation_logs_generation_id;

-- Create a composite index that covers both filtering and sorting
-- This index will be used for queries like:
-- SELECT * FROM generation_logs WHERE generation_id = ? ORDER BY occurred_at ASC
create index idx_generation_logs_generation_id_occurred_at 
  on generation_logs(generation_id, occurred_at);

-- Note: The composite index (generation_id, occurred_at) can also be used
-- for queries that only filter by generation_id, so we don't need a separate
-- single-column index on generation_id.

