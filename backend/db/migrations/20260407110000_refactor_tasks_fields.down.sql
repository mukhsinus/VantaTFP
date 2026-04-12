DROP INDEX IF EXISTS idx_tasks_completed_at;
DROP INDEX IF EXISTS idx_tasks_deadline;

ALTER TABLE tasks
  DROP CONSTRAINT IF EXISTS chk_tasks_completed_at_done;

ALTER TABLE tasks
  DROP CONSTRAINT IF EXISTS chk_tasks_status_values;

ALTER TABLE tasks
  DROP COLUMN IF EXISTS completed_at,
  DROP COLUMN IF EXISTS deadline;
