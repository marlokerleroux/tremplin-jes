-- Fix the is_admin() function to check the role in profiles table instead of user_metadata

-- Use CREATE OR REPLACE instead of DROP to avoid dependency errors
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  );
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.is_admin() IS 'Returns true if the current user has admin role in profiles table';
