import type { Pool } from 'pg';

export interface PaymentRequestRow {
  id: string;
  tenant_id: string;
  user_id: string;
  plan: string;
  amount: string;
  status: 'pending' | 'confirmed' | 'rejected';
  proof: string | null;
  admin_note: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export class PaymentsRepository {
  constructor(private readonly db: Pool) {}

  async create(data: {
    tenantId: string;
    userId: string;
    plan: string;
    amount: number;
    proof?: string;
  }): Promise<PaymentRequestRow> {
    const result = await this.db.query<PaymentRequestRow>(
      `
      INSERT INTO payment_requests (tenant_id, user_id, plan, amount, proof, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())
      RETURNING *
      `,
      [data.tenantId, data.userId, data.plan, data.amount, data.proof ?? null]
    );
    return result.rows[0];
  }

  async findById(id: string, tenantId?: string): Promise<PaymentRequestRow | null> {
    const sql = tenantId
      ? `SELECT * FROM payment_requests WHERE id = $1 AND tenant_id = $2 LIMIT 1`
      : `SELECT * FROM payment_requests WHERE id = $1 LIMIT 1`;
    const params = tenantId ? [id, tenantId] : [id];
    const result = await this.db.query<PaymentRequestRow>(sql, params);
    return result.rows[0] ?? null;
  }

  async listByTenant(tenantId: string): Promise<PaymentRequestRow[]> {
    const result = await this.db.query<PaymentRequestRow>(
      `SELECT * FROM payment_requests WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    );
    return result.rows;
  }

  async listPending(): Promise<PaymentRequestRow[]> {
    const result = await this.db.query<PaymentRequestRow>(
      `SELECT * FROM payment_requests WHERE status = 'pending' ORDER BY created_at ASC`
    );
    return result.rows;
  }

  async confirm(id: string, confirmedBy: string, adminNote?: string): Promise<PaymentRequestRow> {
    const result = await this.db.query<PaymentRequestRow>(
      `
      UPDATE payment_requests
      SET status = 'confirmed', confirmed_by = $2, confirmed_at = NOW(), admin_note = $3, updated_at = NOW()
      WHERE id = $1 AND status = 'pending'
      RETURNING *
      `,
      [id, confirmedBy, adminNote ?? null]
    );
    return result.rows[0];
  }

  async reject(id: string, confirmedBy: string, adminNote?: string): Promise<PaymentRequestRow> {
    const result = await this.db.query<PaymentRequestRow>(
      `
      UPDATE payment_requests
      SET status = 'rejected', confirmed_by = $2, confirmed_at = NOW(), admin_note = $3, updated_at = NOW()
      WHERE id = $1 AND status = 'pending'
      RETURNING *
      `,
      [id, confirmedBy, adminNote ?? null]
    );
    return result.rows[0];
  }
}
