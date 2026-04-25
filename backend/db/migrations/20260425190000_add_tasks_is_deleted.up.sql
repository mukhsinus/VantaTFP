ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_is_deleted
  ON tasks (tenant_id, is_deleted, created_at DESC);
