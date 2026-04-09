CREATE TABLE IF NOT EXISTS reports_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  format TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_reports_history_generated_by_scoped
    FOREIGN KEY (tenant_id, generated_by)
    REFERENCES users(tenant_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_reports_history_type
    CHECK (report_type IN ('KPI', 'PAYROLL', 'TASKS')),
  CONSTRAINT chk_reports_history_format
    CHECK (format IN ('JSON', 'CSV', 'PDF'))
);

CREATE INDEX IF NOT EXISTS idx_reports_history_tenant_created_at
  ON reports_history (tenant_id, created_at DESC);
