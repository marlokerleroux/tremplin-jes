-- Allow all authenticated users to read schedule config
-- This is needed so candidates can see if the schedule is validated and view their time slots

-- Drop the existing admin-only read policy
DROP POLICY IF EXISTS "Admins can read schedule config" ON schedule_config;

-- Create new policy that allows all authenticated users to read
CREATE POLICY "Authenticated users can read schedule config"
  ON schedule_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep the admin-only update policy (already exists)
-- Admins can still update, but now everyone can read
