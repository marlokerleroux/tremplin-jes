-- Set a user as admin by email
-- Replace 'your-email@example.com' with the actual admin email

UPDATE profiles 
SET role = 'admin' 
WHERE email = 'marlokerleroux@icloud.com';

-- Verify the update
SELECT id, email, first_name, last_name, role 
FROM profiles 
WHERE email = 'marlokerleroux@icloud.com';
