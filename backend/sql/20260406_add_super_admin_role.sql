-- Add super admin role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Create index for super admin queries
CREATE INDEX IF NOT EXISTS idx_users_super_admin ON users(is_super_admin);

-- Add comment (PostgreSQL style)
COMMENT ON COLUMN users.is_super_admin IS 'Super admin can manage tenants and upgrade plans across the system';
