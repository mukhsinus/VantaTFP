-- Advanced RBAC: tenant-aware roles + permissions + role mapping.
-- Existing users.role and JWT role are preserved for backward compatibility.

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (action, resource)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_roles_tenant_code ON roles (tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions (permission_id);

INSERT INTO permissions (action, resource)
VALUES
  ('manage', 'all'),
  ('read', 'users'),
  ('write', 'users'),
  ('read', 'tasks'),
  ('write', 'tasks'),
  ('read', 'kpi'),
  ('write', 'kpi'),
  ('read', 'payroll'),
  ('write', 'payroll'),
  ('read', 'reports'),
  ('write', 'reports'),
  ('read', 'tenants'),
  ('write', 'tenants'),
  ('read', 'billing'),
  ('write', 'billing')
ON CONFLICT (action, resource) DO NOTHING;

INSERT INTO roles (tenant_id, name, code, is_system)
VALUES
  (NULL, 'Administrator', 'ADMIN', TRUE),
  (NULL, 'Manager', 'MANAGER', TRUE),
  (NULL, 'Employee', 'EMPLOYEE', TRUE)
ON CONFLICT (tenant_id, code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL
  AND r.code = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
  ON (p.action, p.resource) IN (
    ('read', 'users'),
    ('write', 'users'),
    ('read', 'tasks'),
    ('write', 'tasks'),
    ('read', 'kpi'),
    ('write', 'kpi'),
    ('read', 'payroll'),
    ('write', 'payroll'),
    ('read', 'reports'),
    ('write', 'reports'),
    ('read', 'tenants')
  )
WHERE r.tenant_id IS NULL
  AND r.code = 'MANAGER'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
  ON (p.action, p.resource) IN (
    ('read', 'tasks'),
    ('read', 'kpi'),
    ('read', 'reports')
  )
WHERE r.tenant_id IS NULL
  AND r.code = 'EMPLOYEE'
ON CONFLICT DO NOTHING;
