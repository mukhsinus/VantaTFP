-- Bootstrap legacy core tables for fresh installs.
-- Older environments already had these tables before migration tracking.
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  first_name VARCHAR(120) NOT NULL DEFAULT '',
  last_name VARCHAR(120) NOT NULL DEFAULT '',
  email CITEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL DEFAULT '',
  role VARCHAR(32) NOT NULL DEFAULT 'EMPLOYEE',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'TODO',
  priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
  due_date TIMESTAMPTZ,
  assignee_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
