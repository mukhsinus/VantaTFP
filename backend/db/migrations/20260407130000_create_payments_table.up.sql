CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  base NUMERIC(14,2) NOT NULL DEFAULT 0,
  bonus NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_payments_period_valid CHECK (period_end >= period_start),
  CONSTRAINT chk_payments_amounts_non_negative CHECK (
    base >= 0
    AND bonus >= 0
    AND total >= 0
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_tenant_user_period
  ON payments (tenant_id, user_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_user_period
  ON payments (tenant_id, user_id, period_start, period_end);
