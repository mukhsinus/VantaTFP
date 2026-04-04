-- Migration: Create tenant_invites table for invite-based registration
-- This replaces the auto-tenant-assignment vulnerability with a secure invite system

CREATE TABLE IF NOT EXISTS tenant_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE', -- ADMIN, MANAGER, EMPLOYEE
  token VARCHAR(255) NOT NULL UNIQUE,
  token_hash VARCHAR(255) NOT NULL UNIQUE, -- bcrypt hash of token
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure only one active invite per email per tenant
  CONSTRAINT uq_active_invite_per_email UNIQUE(tenant_id, email) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_tenant_invites_tenant_id ON tenant_invites(tenant_id);
CREATE INDEX idx_tenant_invites_email ON tenant_invites(email);
CREATE INDEX idx_tenant_invites_token ON tenant_invites(token);
CREATE INDEX idx_tenant_invites_expires_at ON tenant_invites(expires_at);

-- Add manager_id nullable FK to users (for hierarchy)
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);

-- Add unique constraint on (tenant_id, email) for users
ALTER TABLE users ADD CONSTRAINT uq_users_tenant_email UNIQUE(tenant_id, email) DEFERRABLE INITIALLY DEFERRED;
