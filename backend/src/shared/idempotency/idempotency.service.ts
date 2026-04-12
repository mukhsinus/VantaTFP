import type { Pool } from 'pg';
import { getAdvisoryLockKey } from '../utils/advisory-lock.js';

interface StoredResponseRow {
  response: Record<string, unknown>;
  status_code: number;
}

export interface IdempotentResult {
  response: Record<string, unknown>;
  statusCode: number;
  replayed: boolean;
}

export class IdempotencyService {
  constructor(private readonly db: Pool) {}

  async execute(
    tenantId: string,
    key: string | undefined,
    operation: () => Promise<{ response: Record<string, unknown>; statusCode: number }>
  ): Promise<IdempotentResult> {
    if (!key) {
      const fresh = await operation();
      return { ...fresh, replayed: false };
    }

    const lockClient = await this.db.connect();
    const lockKey = getAdvisoryLockKey(tenantId, `idempotency:${key}`);
    let locked = false;
    try {
      await lockClient.query('SELECT pg_advisory_lock($1::bigint)', [lockKey]);
      locked = true;

      const existing = await this.db.query<StoredResponseRow>(
        `
        SELECT response, status_code
        FROM idempotency_keys
        WHERE tenant_id = $1
          AND key = $2
        LIMIT 1
        `,
        [tenantId, key]
      );

      if (existing.rows[0]) {
        return {
          response: existing.rows[0].response ?? {},
          statusCode: existing.rows[0].status_code ?? 200,
          replayed: true,
        };
      }

      const fresh = await operation();
      await this.db.query(
        `
        INSERT INTO idempotency_keys (tenant_id, key, response, status_code, created_at)
        VALUES ($1, $2, $3::jsonb, $4, NOW())
        ON CONFLICT (tenant_id, key) DO NOTHING
        `,
        [tenantId, key, JSON.stringify(fresh.response), fresh.statusCode]
      );
      return { ...fresh, replayed: false };
    } finally {
      try {
        if (locked) {
          await lockClient.query('SELECT pg_advisory_unlock($1::bigint)', [lockKey]);
        }
      } finally {
        lockClient.release();
      }
    }
  }
}
