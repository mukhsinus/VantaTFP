-- NOTE: `CREATE INDEX CONCURRENTLY` and `DROP INDEX CONCURRENTLY` cannot run inside
-- a transaction block. Ensure your migration runner executes this file without wrapping
-- it in a transaction (or run these statements manually during a maintenance window).

-- Drop composite / partial indexes created in the up migration
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_tenant_status_created_at_desc;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_tenant_assignee_created_at_desc;

DROP INDEX CONCURRENTLY IF EXISTS idx_payroll_tenant_employee_period_desc;

DROP INDEX CONCURRENTLY IF EXISTS ux_tenant_invites_active_email_lower;
DROP INDEX CONCURRENTLY IF EXISTS idx_tenant_invites_tenant_token_active;

-- Optionally recreate single-column indexes (use only if needed)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_tenant_id ON tasks (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_status ON tasks (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assignee_id ON tasks (assignee_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_created_at ON tasks (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_tenant_id ON payroll (tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_employee_id ON payroll (employee_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_status ON payroll (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_period ON payroll (period_start DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_created_at ON payroll (created_at DESC);

-- Restore conventional unique constraint on tenant/email if desired (note: this will create an index)
-- ALTER TABLE tenant_invites
--   ADD CONSTRAINT tenant_invites_tenant_id_email_key UNIQUE (tenant_id, email);
