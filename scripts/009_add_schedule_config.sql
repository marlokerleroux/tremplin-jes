-- Add configuration table for schedule validation
CREATE TABLE IF NOT EXISTS schedule_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_validated BOOLEAN DEFAULT FALSE,
  validated_at TIMESTAMP WITH TIME ZONE,
  validated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default config
INSERT INTO schedule_config (is_validated) VALUES (FALSE);

-- Enable RLS
ALTER TABLE schedule_config ENABLE ROW LEVEL SECURITY;

-- Allow admins to read and update
CREATE POLICY "Admins can read schedule config"
  ON schedule_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update schedule config"
  ON schedule_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
