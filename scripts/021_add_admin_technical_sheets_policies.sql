-- Add policies to allow admins to insert and update technical sheets for any application

-- Allow admins to insert technical sheets for any application
CREATE POLICY "Admins can insert any technical sheet"
ON technical_sheets
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to update any technical sheet
CREATE POLICY "Admins can update any technical sheet"
ON technical_sheets
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
