-- Projects: workspace hierarchy (Space > Project > tasks)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1',
  icon VARCHAR(50) DEFAULT 'folder',
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_projects_creator
    FOREIGN KEY (tenant_id, created_by)
    REFERENCES users(tenant_id, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects (tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_parent ON projects (tenant_id, parent_id);

-- Add project_id to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimate_points SMALLINT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimate_minutes INTEGER;

-- FK for project
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_project;
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_project
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- Self-referencing FK for subtasks
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_parent;
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_parent
  FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks (tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks (tenant_id, parent_task_id);
