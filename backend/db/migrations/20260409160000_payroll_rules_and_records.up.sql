-- Pro payroll: configurable rules + append-only calculation history (extends payments / existing engine).

CREATE TABLE IF NOT EXISTS payroll_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_payroll_rules_type
    CHECK (type IN ('fixed', 'per_task', 'kpi_based'))
);

CREATE INDEX IF NOT EXISTS idx_payroll_rules_tenant_active
  ON payroll_rules (tenant_id, is_active);

CREATE TABLE IF NOT EXISTS payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  payroll_rule_id UUID REFERENCES payroll_rules(id) ON DELETE SET NULL,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_payroll_records_user_scoped
    FOREIGN KEY (tenant_id, user_id)
    REFERENCES users(tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT chk_payroll_records_amount_non_negative
    CHECK (amount >= 0),
  CONSTRAINT chk_payroll_records_period_valid
    CHECK (
      period_start IS NULL
      OR period_end IS NULL
      OR period_end >= period_start
    )
);

CREATE INDEX IF NOT EXISTS idx_payroll_records_tenant_user_created
  ON payroll_records (tenant_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payroll_records_rule_created
  ON payroll_records (payroll_rule_id, created_at DESC);
