-- System vs tenant role separation + tenant_users membership + subscription plan fields.
-- Backward compatible: keeps users.role, users.tenant_id, subscriptions.plan_id.

-- ── Enums ───────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_system_role') THEN
    CREATE TYPE user_system_role AS ENUM ('super_admin', 'user');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_membership_role') THEN
    CREATE TYPE tenant_membership_role AS ENUM ('owner', 'manager', 'employee');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan_tier') THEN
    CREATE TYPE subscription_plan_tier AS ENUM ('basic', 'pro', 'unlimited');
  END IF;
END$$;

-- ── users: system role; allow global users without tenant (super_admin) ─────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS system_role user_system_role NOT NULL DEFAULT 'user';

ALTER TABLE users
  ALTER COLUMN tenant_id DROP NOT NULL;

COMMENT ON COLUMN users.system_role IS 'Platform scope: super_admin (no tenant) vs user.';
COMMENT ON COLUMN users.tenant_id IS 'Legacy primary tenant; prefer tenant_users for membership. Nullable when system_role = super_admin.';

ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_super_admin_no_tenant;
ALTER TABLE users
  ADD CONSTRAINT chk_super_admin_no_tenant
  CHECK (system_role IS DISTINCT FROM 'super_admin'::user_system_role OR tenant_id IS NULL);

-- ── tenant_users: per-tenant role (owner / manager / employee) ─────────────
CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role tenant_membership_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_role
  ON tenant_users (tenant_id, role);

-- At most one owner per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_users_one_owner_per_tenant
  ON tenant_users (tenant_id)
  WHERE role = 'owner';

COMMENT ON TABLE tenant_users IS 'Tenant-scoped roles. super_admin users must not appear here (enforced by trigger).';
COMMENT ON COLUMN tenant_users.role IS 'owner | manager | employee — distinct from users.system_role.';

-- super_admin must not be linked to any tenant
CREATE OR REPLACE FUNCTION trg_tenant_users_reject_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = NEW.user_id
      AND u.system_role = 'super_admin'::user_system_role
  ) THEN
    RAISE EXCEPTION 'super_admin users cannot have tenant_users rows';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenant_users_reject_super_admin ON tenant_users;
CREATE TRIGGER trg_tenant_users_reject_super_admin
  BEFORE INSERT OR UPDATE OF user_id ON tenant_users
  FOR EACH ROW
  EXECUTE FUNCTION trg_tenant_users_reject_super_admin();

-- Backfill from legacy users (tenant_id + role). First ADMIN per tenant → owner; other ADMINs → manager.
INSERT INTO tenant_users (user_id, tenant_id, role)
SELECT m.user_id,
       m.tenant_id,
       CASE
         WHEN m.legacy_role = 'ADMIN' AND m.admin_rank = 1 THEN 'owner'::tenant_membership_role
         WHEN m.legacy_role = 'ADMIN' THEN 'manager'::tenant_membership_role
         WHEN m.legacy_role = 'MANAGER' THEN 'manager'::tenant_membership_role
         ELSE 'employee'::tenant_membership_role
       END
FROM (
  SELECT
    u.id AS user_id,
    u.tenant_id,
    u.role::text AS legacy_role,
    ROW_NUMBER() OVER (
      PARTITION BY u.tenant_id
      ORDER BY CASE WHEN u.role::text = 'ADMIN' THEN 0 ELSE 1 END, u.created_at, u.id
    ) AS admin_rank
  FROM users u
  WHERE u.tenant_id IS NOT NULL
) AS m
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- Tenants with no ADMIN: promote first member (by created_at) to owner if none exists
INSERT INTO tenant_users (user_id, tenant_id, role)
SELECT u.id, u.tenant_id, 'owner'::tenant_membership_role
FROM users u
WHERE u.tenant_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM tenant_users tu
    WHERE tu.tenant_id = u.tenant_id AND tu.role = 'owner'::tenant_membership_role
  )
  AND u.id = (
    SELECT u2.id FROM users u2
    WHERE u2.tenant_id = u.tenant_id
    ORDER BY u2.created_at ASC, u2.id ASC
    LIMIT 1
  )
ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = 'owner'::tenant_membership_role;

-- ── subscriptions: denormalized plan tier + max_users (owner exclusion is app-level) ──
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS plan subscription_plan_tier;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS max_users INTEGER;

COMMENT ON COLUMN subscriptions.plan IS 'Denormalized tier: basic | pro | unlimited. Kept alongside plan_id for compatibility.';
COMMENT ON COLUMN subscriptions.max_users IS 'Seat cap for billing; application must exclude tenant owner from this count.';

-- Backfill plan + max_users from plans.limits JSON
UPDATE subscriptions s
SET
  plan = CASE lower(p.name)
    WHEN 'basic' THEN 'basic'::subscription_plan_tier
    WHEN 'pro' THEN 'pro'::subscription_plan_tier
    ELSE 'unlimited'::subscription_plan_tier
  END,
  max_users = COALESCE(
    s.max_users,
    CASE
      WHEN (p.limits->>'users') IS NULL OR (p.limits->>'users') = 'null' THEN NULL
      ELSE (p.limits->>'users')::integer
    END
  )
FROM plans p
WHERE s.plan_id = p.id
  AND (s.plan IS NULL OR s.max_users IS NULL);

-- Defaults if still null
UPDATE subscriptions
SET plan = COALESCE(plan, 'basic'::subscription_plan_tier)
WHERE plan IS NULL;
