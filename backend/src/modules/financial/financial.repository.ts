import type { Pool, PoolClient } from 'pg';

type Queryable = Pick<Pool, 'query'> | PoolClient;

export interface WalletRow {
  id: string;
  tenant_id: string;
  owner_id: string;
  balance: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionRow {
  id: string;
  tenant_id: string;
  wallet_id: string;
  type: string;
  amount: string;
  balance_after: string;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  idempotency_key: string | null;
  created_at: string;
}

export interface PayoutRow {
  id: string;
  tenant_id: string;
  recipient_id: string;
  wallet_id: string;
  amount: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payroll_id: string | null;
  payout_method: string | null;
  payout_ref: string | null;
  idempotency_key: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export class FinancialRepository {
  constructor(private readonly db: Pool) {}

  async getOrCreateWallet(
    tenantId: string,
    ownerId: string,
    executor: Queryable = this.db
  ): Promise<WalletRow> {
    const result = await executor.query<WalletRow>(
      `
      INSERT INTO wallets (tenant_id, owner_id, balance, currency, is_active, created_at, updated_at)
      VALUES ($1, $2, 0, 'USD', TRUE, NOW(), NOW())
      ON CONFLICT (tenant_id, owner_id) DO UPDATE SET updated_at = NOW()
      RETURNING *
      `,
      [tenantId, ownerId]
    );
    return result.rows[0];
  }

  async getWalletById(id: string, tenantId: string): Promise<WalletRow | null> {
    const result = await this.db.query<WalletRow>(
      `SELECT * FROM wallets WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
      [id, tenantId]
    );
    return result.rows[0] ?? null;
  }

  async listWalletsByTenant(tenantId: string): Promise<WalletRow[]> {
    const result = await this.db.query<WalletRow>(
      `SELECT * FROM wallets WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    );
    return result.rows;
  }

  async creditWallet(
    walletId: string,
    tenantId: string,
    amount: number,
    description: string,
    idempotencyKey: string | null,
    executor: Queryable = this.db
  ): Promise<TransactionRow> {
    const walletResult = await executor.query<{ balance: string }>(
      `
      UPDATE wallets
      SET balance = balance + $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
      RETURNING balance
      `,
      [amount, walletId, tenantId]
    );
    const balanceAfter = parseFloat(walletResult.rows[0]?.balance ?? '0');

    const txResult = await executor.query<TransactionRow>(
      `
      INSERT INTO transactions (tenant_id, wallet_id, type, amount, balance_after, description, idempotency_key, created_at)
      VALUES ($1, $2, 'credit', $3, $4, $5, $6, NOW())
      RETURNING *
      `,
      [tenantId, walletId, amount, balanceAfter, description, idempotencyKey]
    );
    return txResult.rows[0];
  }

  async debitWallet(
    walletId: string,
    tenantId: string,
    amount: number,
    description: string,
    idempotencyKey: string | null,
    executor: Queryable = this.db
  ): Promise<TransactionRow> {
    const walletResult = await executor.query<{ balance: string }>(
      `
      UPDATE wallets
      SET balance = balance - $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3 AND balance >= $1
      RETURNING balance
      `,
      [amount, walletId, tenantId]
    );
    if (!walletResult.rows[0]) {
      throw new Error('Insufficient wallet balance');
    }
    const balanceAfter = parseFloat(walletResult.rows[0].balance);

    const txResult = await executor.query<TransactionRow>(
      `
      INSERT INTO transactions (tenant_id, wallet_id, type, amount, balance_after, description, idempotency_key, created_at)
      VALUES ($1, $2, 'debit', $3, $4, $5, $6, NOW())
      RETURNING *
      `,
      [tenantId, walletId, amount, balanceAfter, description, idempotencyKey]
    );
    return txResult.rows[0];
  }

  async listTransactionsByWallet(walletId: string, tenantId: string): Promise<TransactionRow[]> {
    const result = await this.db.query<TransactionRow>(
      `SELECT * FROM transactions WHERE wallet_id = $1 AND tenant_id = $2 ORDER BY created_at DESC LIMIT 100`,
      [walletId, tenantId]
    );
    return result.rows;
  }

  async createPayout(
    data: {
      tenantId: string;
      recipientId: string;
      walletId: string;
      amount: number;
      payrollId?: string;
      payoutMethod?: string;
      idempotencyKey?: string;
    },
    executor: Queryable = this.db
  ): Promise<PayoutRow> {
    const result = await executor.query<PayoutRow>(
      `
      INSERT INTO payouts (
        tenant_id, recipient_id, wallet_id, amount, status,
        payroll_id, payout_method, idempotency_key, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, NOW(), NOW())
      ON CONFLICT (idempotency_key) DO UPDATE SET updated_at = NOW()
      RETURNING *
      `,
      [
        data.tenantId,
        data.recipientId,
        data.walletId,
        data.amount,
        data.payrollId ?? null,
        data.payoutMethod ?? null,
        data.idempotencyKey ?? null,
      ]
    );
    return result.rows[0];
  }

  async listPayoutsByTenant(tenantId: string): Promise<PayoutRow[]> {
    const result = await this.db.query<PayoutRow>(
      `SELECT * FROM payouts WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    );
    return result.rows;
  }

  async updatePayoutStatus(
    id: string,
    status: 'processing' | 'completed' | 'failed',
    payoutRef?: string
  ): Promise<PayoutRow> {
    const result = await this.db.query<PayoutRow>(
      `
      UPDATE payouts
      SET status = $2, payout_ref = COALESCE($3, payout_ref),
          processed_at = CASE WHEN $2 IN ('completed', 'failed') THEN NOW() ELSE processed_at END,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id, status, payoutRef ?? null]
    );
    return result.rows[0];
  }
}
