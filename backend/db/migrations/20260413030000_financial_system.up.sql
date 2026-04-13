-- Financial system: wallets, transactions, escrow_accounts, payouts (per spec)

CREATE TABLE IF NOT EXISTS wallets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance       NUMERIC(14, 4) NOT NULL DEFAULT 0,
  currency      VARCHAR(10) NOT NULL DEFAULT 'USD',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, owner_id)
);

CREATE INDEX IF NOT EXISTS idx_wallets_tenant ON wallets (tenant_id);
CREATE INDEX IF NOT EXISTS idx_wallets_owner ON wallets (owner_id);

CREATE TABLE IF NOT EXISTS transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  wallet_id       UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type            VARCHAR(30) NOT NULL
                    CHECK (type IN ('credit', 'debit', 'escrow_lock', 'escrow_release', 'payout')),
  amount          NUMERIC(14, 4) NOT NULL,
  balance_after   NUMERIC(14, 4) NOT NULL,
  reference_type  VARCHAR(50),
  reference_id    UUID,
  description     TEXT,
  idempotency_key VARCHAR(255) UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON transactions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions (wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions (reference_type, reference_id);

CREATE TABLE IF NOT EXISTS escrow_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  task_id       UUID REFERENCES tasks(id) ON DELETE SET NULL,
  wallet_id     UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount        NUMERIC(14, 4) NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'locked'
                  CHECK (status IN ('locked', 'released', 'refunded')),
  released_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrow_tenant ON escrow_accounts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_escrow_task ON escrow_accounts (task_id);

CREATE TABLE IF NOT EXISTS payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  recipient_id    UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  wallet_id       UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount          NUMERIC(14, 4) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payroll_id      UUID,
  payout_method   VARCHAR(50),
  payout_ref      TEXT,
  idempotency_key VARCHAR(255) UNIQUE,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_tenant ON payouts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payouts_recipient ON payouts (recipient_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts (status);
