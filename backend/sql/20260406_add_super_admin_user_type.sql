-- Add SUPER_ADMIN as a valid role in the users table
-- This allows users to be marked as super admins without being tied to a tenant

-- Note: PostgreSQL doesn't have a CHECK enum constraint like MySQL
-- So we'll just add the column if it doesn't exist and let the application enforce role validation

-- Ensure is_super_admin column exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Create index for super admin lookups
CREATE INDEX IF NOT EXISTS idx_users_super_admin ON users(is_super_admin);

-- Add comment
COMMENT ON COLUMN users.is_super_admin IS 'Super admin can manage all tenants and system-wide operations';
