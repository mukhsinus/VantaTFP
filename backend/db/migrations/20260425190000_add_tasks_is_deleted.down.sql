DROP INDEX IF EXISTS idx_tasks_tenant_is_deleted;

ALTER TABLE tasks
DROP COLUMN IF EXISTS is_deleted;
