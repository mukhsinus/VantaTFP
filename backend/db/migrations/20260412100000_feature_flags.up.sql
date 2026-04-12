-- Feature flags: per-tenant toggles for hiding/showing features
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_key VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_feature_flags_tenant_key UNIQUE (tenant_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_tenant
  ON feature_flags (tenant_id);

-- Seed default features list (reference, actual rows created per-tenant on first access)
COMMENT ON TABLE feature_flags IS 'Per-tenant feature toggles. Keys: projects, subtasks, comments, labels, custom_fields, dependencies, multiple_assignees, templates, estimates, documents, attachments, recurring_tasks, calendar_view, timeline_view, automations, time_tracking';
