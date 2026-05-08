-- Object employees junction table for assigning employees to objects
CREATE TABLE IF NOT EXISTS object_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  object_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'worker', -- 'supervisor', 'worker', 'inspector', etc.
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  metadata JSONB,
  CONSTRAINT fk_object_employees_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_object_employees_object FOREIGN KEY (object_id) REFERENCES objects(id) ON DELETE CASCADE,
  CONSTRAINT fk_object_employees_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_object_employees_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT unique_active_assignment UNIQUE (object_id, user_id) WHERE removed_at IS NULL
);

-- Indexes for object_employees
CREATE INDEX IF NOT EXISTS idx_object_employees_tenant_id ON object_employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_object_employees_object_id ON object_employees(object_id);
CREATE INDEX IF NOT EXISTS idx_object_employees_user_id ON object_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_object_employees_active ON object_employees(object_id) WHERE removed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_object_employees_assigned_at ON object_employees(tenant_id, assigned_at DESC);

-- Link regular tasks to objects
CREATE TABLE IF NOT EXISTS task_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  task_id UUID NOT NULL,
  object_id UUID NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID NOT NULL,
  metadata JSONB,
  CONSTRAINT fk_task_objects_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_objects_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_objects_object FOREIGN KEY (object_id) REFERENCES objects(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_objects_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT unique_task_object UNIQUE (task_id, object_id)
);

-- Indexes for task_objects
CREATE INDEX IF NOT EXISTS idx_task_objects_tenant_id ON task_objects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_task_objects_task_id ON task_objects(task_id);
CREATE INDEX IF NOT EXISTS idx_task_objects_object_id ON task_objects(object_id);
CREATE INDEX IF NOT EXISTS idx_task_objects_assigned_at ON task_objects(tenant_id, assigned_at DESC);
