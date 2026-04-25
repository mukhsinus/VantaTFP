DROP INDEX IF EXISTS uq_payouts_tenant_idempotency;
DROP INDEX IF EXISTS uq_transactions_tenant_idempotency;

ALTER TABLE transactions
ADD CONSTRAINT transactions_idempotency_key_key UNIQUE (idempotency_key);

ALTER TABLE payouts
ADD CONSTRAINT payouts_idempotency_key_key UNIQUE (idempotency_key);
