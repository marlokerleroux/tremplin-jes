-- Table pour le suivi des auditions le jour J
CREATE TABLE IF NOT EXISTS audition_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE UNIQUE,
  has_arrived BOOLEAN DEFAULT FALSE,
  arrived_at TIMESTAMP WITH TIME ZONE,
  is_checked_in BOOLEAN DEFAULT FALSE, -- a fait l'accueil/émargement
  checked_in_at TIMESTAMP WITH TIME ZONE,
  has_performed BOOLEAN DEFAULT FALSE, -- est passé devant le jury
  performed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT, -- notes de l'organisateur
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_audition_tracking_application_id ON audition_tracking(application_id);

-- RLS policies
ALTER TABLE audition_tracking ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout faire sur le suivi des auditions
CREATE POLICY "Admins can manage audition tracking"
ON audition_tracking FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Les utilisateurs peuvent voir leur propre suivi
CREATE POLICY "Users can view their own audition tracking"
ON audition_tracking FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM applications
    WHERE applications.id = audition_tracking.application_id
    AND applications.user_id = auth.uid()
  )
);
