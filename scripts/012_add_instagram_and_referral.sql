-- Add Instagram and referral source fields to applications table

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS instagram text,
ADD COLUMN IF NOT EXISTS how_did_you_hear text;

COMMENT ON COLUMN public.applications.instagram IS 'Instagram handle of the artist (optional)';
COMMENT ON COLUMN public.applications.how_did_you_hear IS 'How the candidate heard about the competition';
