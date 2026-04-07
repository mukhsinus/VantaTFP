CREATE TABLE IF NOT EXISTS kpi_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  tasks_on_time INTEGER NOT NULL DEFAULT 0,
  tasks_overdue INTEGER NOT NULL DEFAULT 0,
  score NUMERIC(6,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_kpi_records_period_valid
    CHECK (period_end >= period_start),
  CONSTRAINT chk_kpi_records_non_negative
    CHECK (
      tasks_completed >= 0
      AND tasks_on_time >= 0
      AND tasks_overdue >= 0
      AND score >= 0
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_kpi_records_user_period
  ON kpi_records (user_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_kpi_records_tenant_user_period
  ON kpi_records (tenant_id, user_id, period_start, period_end);
