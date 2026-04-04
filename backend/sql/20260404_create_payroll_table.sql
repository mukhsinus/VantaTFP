CREATE TABLE IF NOT EXISTS payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  base_salary NUMERIC(12, 2) NOT NULL,
  bonuses NUMERIC(12, 2) NOT NULL DEFAULT 0,
  deductions NUMERIC(12, 2) NOT NULL DEFAULT 0,
  net_salary NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  notes TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_tenant_id ON payroll(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_created_at ON payroll(created_at DESC);
