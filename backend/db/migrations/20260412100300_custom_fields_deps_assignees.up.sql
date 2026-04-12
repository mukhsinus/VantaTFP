-- Custom fields (per-tenant, applied to tasks)
CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  field_type VARCHAR(20) NOT NULL CHECK (field_type IN ('text','number','date','select','checkbox','url')),
  options JSONB DEFAULT '[]'::jsonb,
  required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_custom_fields_tenant_name UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS task_custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  task_id UUID NOT NULL,
  field_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  value JSONB NOT NULL DEFAULT 'null'::jsonb,
  CONSTRAINT uq_task_field UNIQUE (task_id, field_id),
  CONSTRAINT fk_tcfv_task
    FOREIGN KEY (tenant_id, task_id)
    REFERENCES tasks(tenant_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tcfv_task ON task_custom_field_values (tenant_id, task_id);

-- Task dependencies
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  task_id UUID NOT NULL,
  depends_on_task_id UUID NOT NULL,
  dependency_type VARCHAR(20) NOT NULL DEFAULT 'blocks' CHECK (dependency_type IN ('blocks','blocked_by','relates_to')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_task_dep UNIQUE (task_id, depends_on_task_id),
  CONSTRAINT chk_no_self_dep CHECK (task_id <> depends_on_task_id),
  CONSTRAINT fk_dep_task
    FOREIGN KEY (tenant_id, task_id)
    REFERENCES tasks(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_dep_depends
    FOREIGN KEY (tenant_id, depends_on_task_id)
    REFERENCES tasks(tenant_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_deps_task ON task_dependencies (tenant_id, task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_depends ON task_dependencies (tenant_id, depends_on_task_id);

-- Multiple assignees
CREATE TABLE IF NOT EXISTS task_assignees (
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'assignee' CHECK (role IN ('assignee','reviewer','watcher')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id),
  CONSTRAINT fk_ta_task
    FOREIGN KEY (tenant_id, task_id)
    REFERENCES tasks(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_ta_user
    FOREIGN KEY (tenant_id, user_id)
    REFERENCES users(tenant_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_assignees_task ON task_assignees (tenant_id, task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user ON task_assignees (tenant_id, user_id);
