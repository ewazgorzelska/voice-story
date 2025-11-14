-- Enable RLS for all tables
alter table public.profiles enable row level security;
alter table public.voice_samples enable row level security;
alter table public.stories enable row level security;
alter table public.story_generations enable row level security;
alter table public.generation_logs enable row level security;

--- POLICIES FOR PROFILES ---
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT TO authenticated USING ( auth.uid() = user_id );
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE TO authenticated USING ( auth.uid() = user_id );
CREATE POLICY "Users can delete their own profile." ON public.profiles FOR DELETE TO authenticated USING ( auth.uid() = user_id );

--- POLICIES FOR VOICE SAMPLES (HIGHEST SECURITY) ---
CREATE POLICY "Users can view their own voice sample." ON public.voice_samples FOR SELECT TO authenticated USING ( auth.uid() = user_id );
CREATE POLICY "Users can insert their own voice sample." ON public.voice_samples FOR INSERT TO authenticated WITH CHECK ( auth.uid() = user_id );
CREATE POLICY "Users can update their own voice sample." ON public.voice_samples FOR UPDATE TO authenticated USING ( auth.uid() = user_id );
CREATE POLICY "Users can delete their own voice sample." ON public.voice_samples FOR DELETE TO authenticated USING ( auth.uid() = user_id );

--- POLICIES FOR STORIES (PUBLIC CATALOG) ---
CREATE POLICY "Allow authenticated users read-only access to stories." ON public.stories FOR SELECT TO authenticated USING ( true );

--- POLICIES FOR GENERATED STORIES (USER HISTORY) ---
CREATE POLICY "Users can view their own story generations." ON public.story_generations FOR SELECT TO authenticated USING ( auth.uid() = user_id );
CREATE POLICY "Users can create new story generations." ON public.story_generations FOR INSERT TO authenticated WITH CHECK ( auth.uid() = user_id );
CREATE POLICY "Users can delete their own story generations." ON public.story_generations FOR DELETE TO authenticated USING ( auth.uid() = user_id );

-- We intentionally do not create any policies for `generation_logs`, blocking frontend access.