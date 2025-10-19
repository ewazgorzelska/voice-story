# Database Schema Plan

## 1. Tables

### auth.users

This table is managed by Supabase Auth

### profiles

- user_id UUID PRIMARY KEY
  - REFERENCES auth.users(id) ON DELETE CASCADE
- created_at TIMESTAMPTZ NOT NULL DEFAULT now()
- -- Add additional user metadata columns (e.g., display_name, avatar_url) as needed

### voice_samples

- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL
  - REFERENCES auth.users(id) ON DELETE CASCADE
- elevenlabs_voice_id TEXT NOT NULL
- verification_phrase TEXT NOT NULL
- verified BOOLEAN NOT NULL DEFAULT FALSE
- created_at TIMESTAMPTZ NOT NULL DEFAULT now()
- UNIQUE (user_id)

### stories

- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- title TEXT NOT NULL
- slug TEXT NOT NULL UNIQUE
- content TEXT NOT NULL
- version INTEGER NOT NULL DEFAULT 1
- updated_at TIMESTAMPTZ NOT NULL DEFAULT now()

### story_generations

- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL
  - REFERENCES auth.users(id) ON DELETE CASCADE
- story_id UUID NOT NULL
  - REFERENCES stories(id) ON DELETE CASCADE
- status generation_status NOT NULL DEFAULT 'pending'
- progress INTEGER NOT NULL CHECK (progress BETWEEN 0 AND 100)
- result_url TEXT NOT NULL
- metadata JSONB
- created_at TIMESTAMPTZ NOT NULL DEFAULT now()
- updated_at TIMESTAMPTZ NOT NULL DEFAULT now()

### generation_logs

- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- generation_id UUID NOT NULL
  - REFERENCES story_generations(id) ON DELETE CASCADE
- event TEXT NOT NULL
- occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()

## 2. Relationships

- profiles 1:1 auth.users via profiles.user_id → auth.users.id
- voice_samples N:1 auth.users via voice_samples.user_id → auth.users.id
- story_generations N:1 auth.users via story_generations.user_id → auth.users.id
- story_generations N:1 stories via story_generations.story_id → stories.id
- generation_logs N:1 story_generations via generation_logs.generation_id → story_generations.id

## 3. Indexes

- PRIMARY KEY and UNIQUE constraints create implicit B-tree indexes
- CREATE INDEX idx_voice_samples_user_id ON voice_samples(user_id);
- CREATE INDEX idx_story_generations_user_id ON story_generations(user_id);
- CREATE INDEX idx_story_generations_story_id ON story_generations(story_id);
- CREATE INDEX idx_generation_logs_generation_id ON generation_logs(generation_id);
- -- Defer JSONB/GIN indexing on story_generations.metadata until query patterns emerge

## 4. PostgreSQL Policies (RLS)

Enable RLS on tables:

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;
```

### Policy: app_user (owns their data)

```sql
CREATE POLICY user_access_profiles ON profiles
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_access_voice_samples ON voice_samples
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_access_story_generations ON story_generations
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_access_generation_logs ON generation_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM story_generations sg
      WHERE sg.id = generation_logs.generation_id
        AND sg.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM story_generations sg
      WHERE sg.id = generation_logs.generation_id
        AND sg.user_id = auth.uid()
    )
  );
```

### Policy: app_admin (full access)

```sql
CREATE POLICY admin_access_profiles ON profiles
  FOR ALL USING (true);

CREATE POLICY admin_access_voice_samples ON voice_samples
  FOR ALL USING (true);

CREATE POLICY admin_access_story_generations ON story_generations
  FOR ALL USING (true);

CREATE POLICY admin_access_generation_logs ON generation_logs
  FOR ALL USING (true);
```

## 5. Additional Notes

- We define a custom enum for generation status:
  ```sql
  CREATE TYPE generation_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');
  ```
- All UUID defaults use `gen_random_uuid()` (pgcrypto extension).
- Timestamps use `TIMESTAMPTZ` for consistency.
- Future enhancements:
  - JSONB/GIN indexes on `story_generations.metadata` after identifying query patterns
  - Time-based partitioning on `story_generations` for large volume scaling
  - Expand `profiles` metadata columns as feature requirements evolve
  - Monitor performance and add read replicas or connection pooling in Supabase when needed
