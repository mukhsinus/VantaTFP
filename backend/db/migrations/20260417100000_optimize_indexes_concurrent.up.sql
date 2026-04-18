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

-- === Payroll: composite index for tenant+employee ordered by period_start DESC ===
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_tenant_employee_period_desc
  ON payroll (tenant_id, employee_id, period_start DESC);

-- === tenant_invites: remove existing constraint/index on (tenant_id,email) ===
-- Dropping constraint is a DDL operation; it may lock the table briefly.
ALTER TABLE IF EXISTS tenant_invites
  DROP CONSTRAINT IF EXISTS tenant_invites_tenant_id_email_key;

DROP INDEX CONCURRENTLY IF EXISTS idx_tenant_invites_email;
DROP INDEX CONCURRENTLY IF EXISTS idx_tenant_invites_tenant_id;

-- === tenant_invites: partial unique index for active invites (used_at IS NULL) ===
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS ux_tenant_invites_active_email_lower
  ON tenant_invites (tenant_id, lower(email))
  WHERE used_at IS NULL;

-- Optional supporting index for token lookups when invite is active
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_invites_tenant_token_active
  ON tenant_invites (tenant_id, token)
  WHERE used_at IS NULL;

-- End of migration
