ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_idempotency_key_key;

ALTER TABLE payouts
DROP CONSTRAINT IF EXISTS payouts_idempotency_key_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_tenant_idempotency
  ON transactions (tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payouts_tenant_idempotency
  ON payouts (tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
