ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_tasks_overdue_scan
  ON tasks (tenant_id, deadline)
  WHERE status <> 'DONE' AND is_overdue = FALSE AND deadline IS NOT NULL;
