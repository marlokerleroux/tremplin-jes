-- Add privacy policy consent column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS accepted_privacy_policy BOOLEAN DEFAULT FALSE;

-- Add timestamp for when privacy policy was accepted
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at TIMESTAMPTZ;
