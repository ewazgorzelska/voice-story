ALTER TABLE public.profiles
ADD COLUMN voice_cloning_consent_given BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.profiles
ADD COLUMN scheduled_for_deletion_at TIMESTAMPTZ;
