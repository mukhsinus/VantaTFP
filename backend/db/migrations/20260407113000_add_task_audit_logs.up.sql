CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_tenant_id_id_unique
  ON tasks (tenant_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_id_id_unique
  ON users (tenant_id, id);

CREATE TABLE IF NOT EXISTS task_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  task_id UUID NOT NULL,
  actor_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  previous_status TEXT,
  next_status TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_task_audit_task_scoped
    FOREIGN KEY (tenant_id, task_id)
    REFERENCES tasks(tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT fk_task_audit_actor_scoped
    FOREIGN KEY (tenant_id, actor_user_id)
    REFERENCES users(tenant_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_task_audit_action
    CHECK (action IN ('TASK_CREATED', 'TASK_UPDATED', 'TASK_STATUS_CHANGED', 'TASK_DELETED'))
);

CREATE INDEX IF NOT EXISTS idx_task_audit_logs_task_created_at
  ON task_audit_logs (tenant_id, task_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_audit_logs_actor_created_at
  ON task_audit_logs (tenant_id, actor_user_id, created_at DESC);
