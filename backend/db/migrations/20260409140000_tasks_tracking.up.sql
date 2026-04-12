-- Task field-level history (complements existing task_audit_logs — both surfaced via unified history API).
-- Time tracking per task/user.

CREATE TABLE IF NOT EXISTS task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  task_id UUID NOT NULL,
  changed_by UUID NOT NULL,
  old_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  new_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_task_history_task_scoped
    FOREIGN KEY (tenant_id, task_id)
    REFERENCES tasks(tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_task_history_actor_scoped
    FOREIGN KEY (tenant_id, changed_by)
    REFERENCES users(tenant_id, id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_task_history_task_changed_at
  ON task_history (tenant_id, task_id, changed_at DESC);

CREATE TABLE IF NOT EXISTS time_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_time_tracking_task_scoped
    FOREIGN KEY (tenant_id, task_id)
    REFERENCES tasks(tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_time_tracking_user_scoped
    FOREIGN KEY (tenant_id, user_id)
    REFERENCES users(tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT chk_time_tracking_duration_when_stopped
    CHECK (end_time IS NULL OR duration_seconds IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_time_tracking_open_session
  ON time_tracking (tenant_id, user_id, task_id)
  WHERE end_time IS NULL;

CREATE INDEX IF NOT EXISTS idx_time_tracking_task_start
  ON time_tracking (tenant_id, task_id, start_time DESC);
