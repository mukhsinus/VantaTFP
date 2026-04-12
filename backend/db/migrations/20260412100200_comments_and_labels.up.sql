-- Task comments
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  task_id UUID NOT NULL,
  author_id UUID NOT NULL,
  parent_comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_task_comments_task
    FOREIGN KEY (tenant_id, task_id)
    REFERENCES tasks(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_task_comments_author
    FOREIGN KEY (tenant_id, author_id)
    REFERENCES users(tenant_id, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task
  ON task_comments (tenant_id, task_id, created_at);

-- Labels / Tags
CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_labels_tenant_name UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS task_labels (
  task_id UUID NOT NULL,
  label_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id),
  CONSTRAINT fk_task_labels_task
    FOREIGN KEY (tenant_id, task_id)
    REFERENCES tasks(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_task_labels_label
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_labels_task ON task_labels (tenant_id, task_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_label ON task_labels (tenant_id, label_id);
