-- Create time_slots table for audition scheduling
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, start_time)
);

-- Add time_slot_id to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS time_slot_id UUID REFERENCES time_slots(id);

-- Add technical_sheet_validated to technical_sheets table
ALTER TABLE technical_sheets
ADD COLUMN IF NOT EXISTS validated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES profiles(id);

-- Generate time slots for January 31, 2026 (9:00 - 18:00)
DO $$
DECLARE
  slot_time TIME;
  slot_date DATE := '2026-01-31';
BEGIN
  slot_time := '09:00:00';
  WHILE slot_time < '18:00:00' LOOP
    INSERT INTO time_slots (date, start_time, end_time)
    VALUES (slot_date, slot_time, slot_time + INTERVAL '10 minutes')
    ON CONFLICT (date, start_time) DO NOTHING;
    slot_time := slot_time + INTERVAL '10 minutes';
  END LOOP;
END $$;

-- Generate time slots for February 1, 2026 (9:00 - 18:00)
DO $$
DECLARE
  slot_time TIME;
  slot_date DATE := '2026-02-01';
BEGIN
  slot_time := '09:00:00';
  WHILE slot_time < '18:00:00' LOOP
    INSERT INTO time_slots (date, start_time, end_time)
    VALUES (slot_date, slot_time, slot_time + INTERVAL '10 minutes')
    ON CONFLICT (date, start_time) DO NOTHING;
    slot_time := slot_time + INTERVAL '10 minutes';
  END LOOP;
END $$;

-- Enable RLS
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read time slots
CREATE POLICY "Anyone can view time slots"
  ON time_slots FOR SELECT
  USING (true);

-- Only admins can modify time slots
CREATE POLICY "Admins can modify time slots"
  ON time_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
