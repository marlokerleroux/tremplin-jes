-- Add missing INSERT policy for schedule_config
-- This allows admins to create schedule config entries via upsert

CREATE POLICY "Admins can insert schedule config"
  ON schedule_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
