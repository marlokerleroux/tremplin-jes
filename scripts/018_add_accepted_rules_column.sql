-- Add accepted_rules column to applications table
ALTER TABLE applications
ADD COLUMN accepted_rules BOOLEAN NOT NULL DEFAULT false;

-- Add comment
COMMENT ON COLUMN applications.accepted_rules IS 'Indicates if the candidate has accepted the competition rules';
