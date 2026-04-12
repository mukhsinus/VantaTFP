-- Manual super_admin bootstrap (optional). Prefer: `npm run create-super-admin` (bcrypt via Node).
--
-- Prerequisites:
--   - Migration 20260410120000_system_tenant_roles applied (user_system_role enum, users.system_role).
--   - For password hashing in SQL only: pgcrypto (bcrypt-compatible with Node `bcrypt`).
--
-- Replace email/password literals if needed.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Remove tenant membership (DB trigger blocks tenant_users for super_admin).
DELETE FROM tenant_users tu
USING users u
WHERE tu.user_id = u.id
  AND LOWER(u.email) = LOWER('kamolovmuhsin@icloud.com');

-- Upgrade existing row, or insert if missing.
UPDATE users
SET
  tenant_id = NULL,
  system_role = 'super_admin'::user_system_role,
  role = 'ADMIN',
  is_active = TRUE,
  password_hash = crypt('kamolovmuhsin@icloud.com', gen_salt('bf', 12)),
  updated_at = NOW()
WHERE LOWER(email) = LOWER('kamolovmuhsin@icloud.com');

INSERT INTO users (
  tenant_id,
  email,
  password_hash,
  first_name,
  last_name,
  role,
  is_active,
  system_role,
  created_at,
  updated_at
)
SELECT
  NULL,
  'kamolovmuhsin@icloud.com',
  crypt('kamolovmuhsin@icloud.com', gen_salt('bf', 12)),
  'Kamolovmuhsin',
  'Admin',
  'ADMIN',
  TRUE,
  'super_admin'::user_system_role,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE LOWER(email) = LOWER('kamolovmuhsin@icloud.com')
);

COMMIT;

-- No row in tenant_users and no subscription row are required for platform super_admin.
