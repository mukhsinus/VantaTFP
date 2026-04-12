-- Link-based tenant invites (UUID token, no email on the invite row).

CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID NOT NULL UNIQUE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role tenant_membership_role NOT NULL DEFAULT 'employee'::tenant_membership_role,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT invites_role_not_owner CHECK (role IS DISTINCT FROM 'owner'::tenant_membership_role)
);

CREATE INDEX IF NOT EXISTS idx_invites_tenant_id ON invites (tenant_id);
CREATE INDEX IF NOT EXISTS idx_invites_expires_at ON invites (expires_at);
