-- Promote a user to super admin
-- Replace 'user_id_here' with the actual user ID you want to promote

UPDATE users 
SET is_super_admin = true 
WHERE id = 'user_id_here';

-- If you don't know the user ID, here's how to find users:
-- SELECT id, email, first_name, last_name FROM users LIMIT 10;

-- Example to promote the first admin user:
-- UPDATE users SET is_super_admin = true WHERE email = 'admin@example.com' LIMIT 1;

-- View all super admins:
-- SELECT id, email, first_name, last_name, is_super_admin FROM users WHERE is_super_admin = true;
