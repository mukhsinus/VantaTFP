ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

UPDATE tasks
SET deadline = COALESCE(deadline, due_date)
WHERE deadline IS NULL
  AND due_date IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_tasks_status_values'
  ) THEN
    ALTER TABLE tasks
      ADD CONSTRAINT chk_tasks_status_values
      CHECK (status IN ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_tasks_completed_at_done'
  ) THEN
    ALTER TABLE tasks
      ADD CONSTRAINT chk_tasks_completed_at_done
      CHECK (
        (status = 'DONE' AND completed_at IS NOT NULL)
        OR (status <> 'DONE')
      );
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at DESC);
