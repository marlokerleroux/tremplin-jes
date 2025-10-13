-- Simplify technical_sheets table to store PDF uploads instead of form data
-- Drop all the detailed columns and keep only the PDF URL

ALTER TABLE technical_sheets
DROP COLUMN IF EXISTS number_of_performers,
DROP COLUMN IF EXISTS instruments,
DROP COLUMN IF EXISTS microphones_needed,
DROP COLUMN IF EXISTS microphone_types,
DROP COLUMN IF EXISTS di_boxes_needed,
DROP COLUMN IF EXISTS monitors_needed,
DROP COLUMN IF EXISTS brings_own_amplification,
DROP COLUMN IF EXISTS amplification_details,
DROP COLUMN IF EXISTS power_outlets_needed,
DROP COLUMN IF EXISTS stage_setup_time,
DROP COLUMN IF EXISTS lighting_requirements,
DROP COLUMN IF EXISTS additional_requirements;

-- Add new columns for PDF upload
ALTER TABLE technical_sheets
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS validated BOOLEAN DEFAULT FALSE;

-- Add comment
COMMENT ON TABLE technical_sheets IS 'Stores uploaded technical sheet PDFs for each application';
