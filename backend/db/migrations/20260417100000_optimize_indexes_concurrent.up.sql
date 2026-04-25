-- NOTE: `CREATE INDEX CONCURRENTLY` and `DROP INDEX CONCURRENTLY` cannot run inside
-- a transaction block. Ensure your migration runner executes this file without wrapping
-- it in a transaction (or run these statements manually during a maintenance window).

-- === Tasks: drop redundant single-column indexes (concurrent) ===
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_tenant_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_assignee_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_created_at;

-- === Tasks: create composite indexes to satisfy WHERE + ORDER BY ===
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_tenant_status_created_at_desc
  ON tasks (tenant_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_tenant_assignee_created_at_desc
  ON tasks (tenant_id, assignee_id, created_at DESC);

-- === Payroll: remove old single-column indexes (concurrent) ===
DROP INDEX CONCURRENTLY IF EXISTS idx_payroll_tenant_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_payroll_employee_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_payroll_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_payroll_period;
DROP INDEX CONCURRENTLY IF EXISTS idx_payroll_created_at;

-- === Payroll records: composite index for tenant+user ordered by period_start DESC ===
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_tenant_employee_period_desc
  ON payroll_records (tenant_id, user_id, period_start DESC);

-- === invites: optimize active invite scans ===
DROP INDEX CONCURRENTLY IF EXISTS idx_invites_tenant_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_invites_expires_at;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invites_tenant_expires_active
  ON invites (tenant_id, expires_at DESC)
  WHERE used_at IS NULL;

-- End of migration
