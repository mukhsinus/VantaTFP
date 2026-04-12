-- Roll back system/tenant role migration (order matters).

DROP TRIGGER IF EXISTS trg_tenant_users_reject_super_admin ON tenant_users;
DROP FUNCTION IF EXISTS trg_tenant_users_reject_super_admin();

DROP INDEX IF EXISTS uq_tenant_users_one_owner_per_tenant;
DROP INDEX IF EXISTS idx_tenant_users_tenant_role;
DROP TABLE IF EXISTS tenant_users;

ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_super_admin_no_tenant;

ALTER TABLE users DROP COLUMN IF EXISTS system_role;

-- Restore NOT NULL only if you had no NULL tenant_id rows; safe no-op in many dev DBs
-- ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE subscriptions DROP COLUMN IF EXISTS max_users;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS plan;

DROP TYPE IF EXISTS subscription_plan_tier;
DROP TYPE IF EXISTS tenant_membership_role;
DROP TYPE IF EXISTS user_system_role;
