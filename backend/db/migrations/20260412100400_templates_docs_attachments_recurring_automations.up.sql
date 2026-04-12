-- Task templates
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  default_priority VARCHAR(10) DEFAULT 'MEDIUM',
  default_status VARCHAR(20) DEFAULT 'TODO',
  checklist JSONB DEFAULT '[]'::jsonb,
  default_labels JSONB DEFAULT '[]'::jsonb,
  default_estimate_points SMALLINT,
  default_estimate_minutes INTEGER,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_tt_creator
    FOREIGN KEY (tenant_id, created_by)
    REFERENCES users(tenant_id, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_task_templates_tenant ON task_templates (tenant_id);

-- Documents / Wiki pages (Notion-like)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  content_type VARCHAR(20) NOT NULL DEFAULT 'markdown' CHECK (content_type IN ('markdown','richtext')),
  icon VARCHAR(50) DEFAULT '📄',
  cover_url TEXT,
  is_template BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  last_edited_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_docs_creator
    FOREIGN KEY (tenant_id, created_by)
    REFERENCES users(tenant_id, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents (tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents (tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents (tenant_id, parent_id);

-- Task attachments (metadata only, files stored externally)
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  task_id UUID NOT NULL,
  uploaded_by UUID NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  mime_type VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream',
  storage_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_attach_task
    FOREIGN KEY (tenant_id, task_id)
    REFERENCES tasks(tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_attach_uploader
    FOREIGN KEY (tenant_id, uploaded_by)
    REFERENCES users(tenant_id, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments (tenant_id, task_id);

-- Recurring tasks
CREATE TABLE IF NOT EXISTS recurring_task_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID REFERENCES task_templates(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  assignee_id UUID,
  priority VARCHAR(10) DEFAULT 'MEDIUM',
  recurrence_type VARCHAR(20) NOT NULL CHECK (recurrence_type IN ('daily','weekly','biweekly','monthly','quarterly','yearly','custom')),
  cron_expression VARCHAR(100),
  next_run_at TIMESTAMPTZ NOT NULL,
  last_run_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_rtr_creator
    FOREIGN KEY (tenant_id, created_by)
    REFERENCES users(tenant_id, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_recurring_rules_tenant ON recurring_task_rules (tenant_id);
CREATE INDEX IF NOT EXISTS idx_recurring_rules_next ON recurring_task_rules (next_run_at) WHERE active = true;

-- Automation rules
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('task_status_changed','task_created','task_assigned','task_due_soon','task_overdue','comment_added')),
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('change_status','assign_user','add_label','send_notification','move_to_project','set_priority','create_subtask')),
  action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_ar_creator
    FOREIGN KEY (tenant_id, created_by)
    REFERENCES users(tenant_id, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_tenant ON automation_rules (tenant_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger ON automation_rules (tenant_id, trigger_type) WHERE active = true;
