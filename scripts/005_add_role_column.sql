-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Add check constraint to ensure role is either 'user' or 'admin'
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('user', 'admin'));

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
