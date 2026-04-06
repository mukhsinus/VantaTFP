-- Allow NULL tenant_id for super admin users
-- Super admins are system-wide and not tied to specific tenants

ALTER TABLE users 
ALTER COLUMN tenant_id DROP NOT NULL;
