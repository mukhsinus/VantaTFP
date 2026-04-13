-- Normalize billing payment requests to plan_id + approval states.
-- Keeps compatibility with legacy `plan` column while making approval flow authoritative.

CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES plans(id) ON DELETE RESTRICT,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  proof TEXT,
  admin_note TEXT,
  confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE payment_requests
ADD COLUMN IF NOT EXISTS plan VARCHAR(50);

ALTER TABLE payment_requests
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id) ON DELETE RESTRICT;

ALTER TABLE payment_requests
ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE payment_requests
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE payment_requests
ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE payment_requests
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

ALTER TABLE payment_requests
ADD COLUMN IF NOT EXISTS admin_note TEXT;

ALTER TABLE payment_requests
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE payment_requests
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE payment_requests pr
SET plan_id = p.id
FROM plans p
WHERE pr.plan_id IS NULL
  AND lower(pr.plan) = lower(p.name);

UPDATE payment_requests pr
SET plan_id = p.id
FROM plans p
WHERE pr.plan_id IS NULL
  AND p.name = 'basic';

UPDATE payment_requests
SET status = 'approved'
WHERE status = 'confirmed';

ALTER TABLE payment_requests
DROP CONSTRAINT IF EXISTS payment_requests_status_check;

ALTER TABLE payment_requests
ADD CONSTRAINT payment_requests_status_check
CHECK (status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_payment_requests_plan_id
  ON payment_requests (plan_id);

CREATE INDEX IF NOT EXISTS idx_payment_requests_tenant
  ON payment_requests (tenant_id);

CREATE INDEX IF NOT EXISTS idx_payment_requests_status
  ON payment_requests (status);
