-- Create ENUM types for objects module
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'object_type') THEN
    CREATE TYPE object_type AS ENUM ('equipment', 'department', 'vehicle', 'location', 'facility', 'asset', 'other');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'object_task_status') THEN
    CREATE TYPE object_task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');
  END IF;
END$$;

-- Objects table
CREATE TABLE IF NOT EXISTS objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  object_type object_type NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  metadata JSONB,
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_objects_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_objects_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_objects_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for objects
CREATE INDEX IF NOT EXISTS idx_objects_tenant_id ON objects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_objects_object_type ON objects(tenant_id, object_type);
CREATE INDEX IF NOT EXISTS idx_objects_status ON objects(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_objects_created_at ON objects(tenant_id, created_at DESC);

-- Object tasks table
CREATE TABLE IF NOT EXISTS object_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  object_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to UUID,
  status object_task_status NOT NULL DEFAULT 'pending',
  priority task_priority NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  estimated_duration_minutes INT,
  actual_duration_minutes INT,
  notes TEXT,
  metadata JSONB,
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_object_tasks_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_object_tasks_object FOREIGN KEY (object_id) REFERENCES objects(id) ON DELETE CASCADE,
  CONSTRAINT fk_object_tasks_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_object_tasks_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_object_tasks_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for object_tasks
CREATE INDEX IF NOT EXISTS idx_object_tasks_tenant_id ON object_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_object_tasks_object_id ON object_tasks(object_id);
CREATE INDEX IF NOT EXISTS idx_object_tasks_assigned_to ON object_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_object_tasks_status ON object_tasks(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_object_tasks_priority ON object_tasks(tenant_id, priority);
CREATE INDEX IF NOT EXISTS idx_object_tasks_due_date ON object_tasks(tenant_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_object_tasks_created_at ON object_tasks(tenant_id, created_at DESC);

-- Object audit logs table
CREATE TABLE IF NOT EXISTS object_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  object_id UUID,
  object_task_id UUID,
  actor_user_id UUID,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_object_audit_logs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_object_audit_logs_object FOREIGN KEY (object_id) REFERENCES objects(id) ON DELETE CASCADE,
  CONSTRAINT fk_object_audit_logs_object_task FOREIGN KEY (object_task_id) REFERENCES object_tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_object_audit_logs_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for object_audit_logs
CREATE INDEX IF NOT EXISTS idx_object_audit_logs_tenant_id ON object_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_object_audit_logs_object_id ON object_audit_logs(object_id);
CREATE INDEX IF NOT EXISTS idx_object_audit_logs_object_task_id ON object_audit_logs(object_task_id);
CREATE INDEX IF NOT EXISTS idx_object_audit_logs_created_at ON object_audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_object_audit_logs_action ON object_audit_logs(tenant_id, action);

-- Object task dependencies table (for task chains)
CREATE TABLE IF NOT EXISTS object_task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  task_id UUID NOT NULL,
  depends_on_task_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_object_task_deps_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_object_task_deps_task FOREIGN KEY (task_id) REFERENCES object_tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_object_task_deps_depends_on FOREIGN KEY (depends_on_task_id) REFERENCES object_tasks(id) ON DELETE CASCADE,
  CONSTRAINT chk_no_self_dep CHECK (task_id != depends_on_task_id),
  UNIQUE(task_id, depends_on_task_id)
);

-- Indexes for object_task_dependencies
CREATE INDEX IF NOT EXISTS idx_object_task_deps_tenant_id ON object_task_dependencies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_object_task_deps_task_id ON object_task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_object_task_deps_depends_on_task_id ON object_task_dependencies(depends_on_task_id);
