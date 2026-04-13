-- Manual payment flow per spec:
-- User sees card number, pays manually, clicks "I paid" -> payment_request created
-- Admin confirms -> plan activated
CREATE TABLE IF NOT EXISTS payment_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  plan          VARCHAR(50) NOT NULL,
  amount        NUMERIC(10, 2) NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'confirmed', 'rejected')),
  proof         TEXT,
  admin_note    TEXT,
  confirmed_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  confirmed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_requests_tenant ON payment_requests (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests (status);
