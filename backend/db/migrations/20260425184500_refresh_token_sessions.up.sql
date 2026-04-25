CREATE TABLE IF NOT EXISTS refresh_token_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NULL REFERENCES tenants(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  replaced_by_token_hash VARCHAR(128) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_refresh_token_sessions_user_active
  ON refresh_token_sessions (user_id, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_refresh_token_sessions_tenant_active
  ON refresh_token_sessions (tenant_id, expires_at DESC)
  WHERE revoked_at IS NULL;
