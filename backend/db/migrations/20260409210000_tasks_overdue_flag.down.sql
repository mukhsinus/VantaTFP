DROP INDEX IF EXISTS idx_tasks_overdue_scan;

ALTER TABLE tasks
  DROP COLUMN IF EXISTS is_overdue;
