import { Pool, PoolClient } from 'pg';
import type { PlanLimits } from './billing.types.js';
import { getAdvisoryLockKey } from '../../shared/utils/advisory-lock.js';

export interface SubscriptionPlanRow {
  plan_id: string;
  plan_name: string;
  limits: PlanLimits;
}

type Queryable = Pick<Pool, 'query'> | Pick<PoolClient, 'query'>;

export class BillingRepository {
  constructor(private readonly db: Pool) {}

  async withTransaction<T>(fn: (tx: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async lockTenantMetric(
    tenantId: string,
    metric: string,
    executor: Queryable = this.db
  ): Promise<void> {
    const lockKey = getAdvisoryLockKey(tenantId, metric);
    await executor.query(
      `
      SELECT pg_advisory_xact_lock($1::bigint)
      `,
      [lockKey]
    );
  }

  async ensureDefaultSubscription(tenantId: string, executor: Queryable = this.db): Promise<void> {
    await executor.query(
      `
      INSERT INTO subscriptions (tenant_id, plan_id, status)
      SELECT $1, p.id, 'active'
      FROM plans p
      WHERE p.name = 'basic'
      LIMIT 1
      ON CONFLICT (tenant_id) DO NOTHING
      `,
      [tenantId]
    );
  }

  async getSubscriptionPlan(
    tenantId: string,
    executor: Queryable = this.db
  ): Promise<SubscriptionPlanRow | null> {
    const result = await executor.query<{
      plan_id: string;
      plan_name: string;
      limits: PlanLimits;
    }>(
      `
      SELECT p.id AS plan_id, p.name AS plan_name, p.limits
      FROM subscriptions s
      INNER JOIN plans p ON p.id = s.plan_id
      WHERE s.tenant_id = $1
        AND s.status = 'active'
      LIMIT 1
      `,
      [tenantId]
    );
    return result.rows[0] ?? null;
  }

  async getBasicPlanFallback(executor: Queryable = this.db): Promise<SubscriptionPlanRow> {
    const result = await executor.query<{
      plan_id: string;
      plan_name: string;
      limits: PlanLimits;
    }>(
      `
      SELECT id AS plan_id, name AS plan_name, limits
      FROM plans
      WHERE name = 'basic'
      LIMIT 1
      `
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Billing misconfiguration: basic plan row missing');
    }
    return row;
  }

  async countActiveUsers(tenantId: string, executor: Queryable = this.db): Promise<number> {
    const result = await executor.query<{ total: string }>(
      `
      SELECT COUNT(*)::text AS total
      FROM users
      WHERE tenant_id = $1 AND is_active = TRUE
      `,
      [tenantId]
    );
    return Number(result.rows[0]?.total ?? 0);
  }

  async countTasks(tenantId: string, executor: Queryable = this.db): Promise<number> {
    const result = await executor.query<{ total: string }>(
      `
      SELECT COUNT(*)::text AS total
      FROM tasks
      WHERE tenant_id = $1
      `,
      [tenantId]
    );
    return Number(result.rows[0]?.total ?? 0);
  }

  async getApiUsageForPeriod(
    tenantId: string,
    periodStart: Date,
    metric = 'api_requests',
    executor: Queryable = this.db
  ): Promise<number> {
    const result = await executor.query<{ value: string }>(
      `
      SELECT value::text
      FROM usage_tracking
      WHERE tenant_id = $1
        AND metric = $2
        AND period_start = $3
      LIMIT 1
      `,
      [tenantId, metric, periodStart]
    );
    return Number(result.rows[0]?.value ?? 0);
  }

  /**
   * Increments API usage for the bucket; returns the new total for this period.
   */
  async incrementUsage(
    tenantId: string,
    periodStart: Date,
    metric = 'api_requests',
    executor: Queryable = this.db
  ): Promise<number> {
    const result = await executor.query<{ value: string }>(
      `
      INSERT INTO usage_tracking (tenant_id, metric, value, period_start)
      VALUES ($1, $2, 1, $3)
      ON CONFLICT (tenant_id, metric, period_start)
      DO UPDATE SET
        value = usage_tracking.value + 1,
        updated_at = NOW()
      RETURNING value::text
      `,
      [tenantId, metric, periodStart]
    );
    return Number(result.rows[0]?.value ?? 0);
  }

  async incrementApiUsage(
    tenantId: string,
    periodStart: Date,
    metric = 'api_requests',
    executor: Queryable = this.db
  ): Promise<number> {
    return this.incrementUsage(tenantId, periodStart, metric, executor);
  }
}
