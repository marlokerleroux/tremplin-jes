-- Add policies to allow admins to insert and update parental authorizations for any application

-- Allow admins to insert parental authorizations for any application
CREATE POLICY "Admins can insert any parental authorization"
ON parental_authorizations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to delete any parental authorization
CREATE POLICY "Admins can delete any parental authorization"
ON parental_authorizations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
