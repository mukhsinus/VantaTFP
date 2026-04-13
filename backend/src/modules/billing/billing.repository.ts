import { Pool, PoolClient } from 'pg';
import type { PlanLimits } from './billing.types.js';
import { getAdvisoryLockKey } from '../../shared/utils/advisory-lock.js';
import { getBillingSubscriptionCaps } from './billing-schema-caps.js';
import { getAuthSchemaCaps } from '../auth/auth-schema-caps.js';

export interface SubscriptionPlanRow {
  plan_id: string;
  plan_name: string;
  limits: PlanLimits;
  /** From `subscriptions.max_users` when present */
  subscription_max_users: number | null;
  /** From `subscriptions.plan` enum or fallback to `plans.name` */
  subscription_plan_tier: string;
  /** `trim(subscriptions.status::text)` */
  subscription_status: string;
  trial_ends_at: Date | null;
  /** Denormalized caps; NULL = unlimited */
  tasks_limit: number | null;
  api_limit: number | null;
}

type Queryable = Pick<Pool, 'query'> | Pick<PoolClient, 'query'>;

export interface PendingPaymentRequestRow {
  id: string;
  plan_name: string;
  status: 'pending' | 'approved' | 'rejected';
  amount: string;
  created_at: Date;
}

export class BillingRepository {
  constructor(private readonly db: Pool) {}
  private plansPriceColumnCache: boolean | null = null;

  static isUndefinedTableError(error: unknown, tableName: string): boolean {
    const pgError = error as { code?: string; message?: string };
    if (pgError?.code !== '42P01') {
      return false;
    }
    return String(pgError?.message ?? '')
      .toLowerCase()
      .includes(tableName.toLowerCase());
  }

  async hasPaymentRequestsTable(executor: Queryable = this.db): Promise<boolean> {
    const result = await executor.query<{ exists: boolean }>(
      `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'payment_requests'
      ) AS exists
      `
    );
    return result.rows[0]?.exists ?? false;
  }

  async getPaymentRequestsMissingColumns(
    executor: Queryable = this.db
  ): Promise<string[]> {
    const required = [
      'id',
      'tenant_id',
      'user_id',
      'plan_id',
      'amount',
      'status',
      'created_at',
      'updated_at',
      'confirmed_by',
      'confirmed_at',
      'admin_note',
    ];
    const result = await executor.query<{ column_name: string }>(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'payment_requests'
      `
    );
    const have = new Set(result.rows.map((row) => row.column_name));
    return required.filter((columnName) => !have.has(columnName));
  }

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
    const caps = await getBillingSubscriptionCaps(this.db);
    if (caps.planColumn && caps.maxUsersColumn && caps.trialEndsAtColumn) {
      await executor.query(
        `
        INSERT INTO subscriptions (
          tenant_id,
          plan_id,
          plan,
          max_users,
          tasks_limit,
          api_limit,
          status,
          trial_ends_at,
          current_period_end
        )
        SELECT
          $1,
          p.id,
          'basic'::subscription_plan_tier,
          CASE
            WHEN (p.limits->>'users') IS NULL OR (p.limits->>'users') = 'null' THEN NULL
            ELSE (p.limits->>'users')::integer
          END,
          CASE
            WHEN jsonb_typeof(p.limits->'tasks') = 'null' OR (p.limits->>'tasks') IS NULL THEN NULL
            ELSE (NULLIF(p.limits->>'tasks', 'null'))::integer
          END,
          CASE
            WHEN jsonb_typeof(p.limits->'api_rate_per_hour') = 'null'
              OR (p.limits->>'api_rate_per_hour') IS NULL
            THEN NULL
            ELSE (NULLIF(p.limits->>'api_rate_per_hour', 'null'))::integer
          END,
          'trial'::subscription_status,
          NOW() + INTERVAL '15 days',
          NOW() + INTERVAL '15 days'
        FROM plans p
        WHERE p.name = 'basic'
        LIMIT 1
        ON CONFLICT (tenant_id) DO NOTHING
        `,
        [tenantId]
      );
      return;
    }

    if (caps.planColumn && caps.maxUsersColumn) {
      await executor.query(
        `
        INSERT INTO subscriptions (tenant_id, plan_id, plan, max_users, status)
        SELECT
          $1,
          p.id,
          'basic'::subscription_plan_tier,
          CASE
            WHEN (p.limits->>'users') IS NULL OR (p.limits->>'users') = 'null' THEN NULL
            ELSE (p.limits->>'users')::integer
          END,
          'active'
        FROM plans p
        WHERE p.name = 'basic'
        LIMIT 1
        ON CONFLICT (tenant_id) DO NOTHING
        `,
        [tenantId]
      );
      return;
    }

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

  /**
   * Raw subscription status (includes `canceled`), for access gates.
   */
  async getSubscriptionStatusRaw(
    tenantId: string,
    executor: Queryable = this.db
  ): Promise<string | null> {
    const result = await executor.query<{ status: string }>(
      `
      SELECT trim(status::text) AS status
      FROM subscriptions
      WHERE tenant_id = $1
      LIMIT 1
      `,
      [tenantId]
    );
    return result.rows[0]?.status ?? null;
  }

  /** Expired trials become `past_due` (read path, idempotent per tenant). */
  async applyExpiredTrialTransition(
    tenantId: string,
    executor: Queryable = this.db
  ): Promise<void> {
    const caps = await getBillingSubscriptionCaps(this.db);
    if (!caps.trialEndsAtColumn) {
      return;
    }
    await executor.query(
      `
      UPDATE subscriptions
      SET
        status = 'past_due'::subscription_status,
        updated_at = NOW()
      WHERE tenant_id = $1
        AND status = 'trial'::subscription_status
        AND trial_ends_at IS NOT NULL
        AND trial_ends_at < NOW()
      `,
      [tenantId]
    );
  }

  async getSubscriptionPlan(
    tenantId: string,
    executor: Queryable = this.db
  ): Promise<SubscriptionPlanRow | null> {
    const caps = await getBillingSubscriptionCaps(this.db);
    const maxUsersSql = caps.maxUsersColumn ? 's.max_users' : 'NULL::integer';
    const tierSql = caps.planColumn
      ? `COALESCE(NULLIF(trim(s.plan::text), ''), lower(p.name))`
      : `lower(p.name)`;
    const trialSql = caps.trialEndsAtColumn ? 's.trial_ends_at' : 'NULL::timestamptz';
    const tasksLimitSql = caps.trialEndsAtColumn ? 's.tasks_limit' : 'NULL::integer';
    const apiLimitSql = caps.trialEndsAtColumn ? 's.api_limit' : 'NULL::integer';

    const result = await executor.query<SubscriptionPlanRow>(
      `
      SELECT
        p.id AS plan_id,
        p.name AS plan_name,
        p.limits,
        ${maxUsersSql} AS subscription_max_users,
        ${tierSql} AS subscription_plan_tier,
        trim(s.status::text) AS subscription_status,
        ${trialSql} AS trial_ends_at,
        ${tasksLimitSql} AS tasks_limit,
        ${apiLimitSql} AS api_limit
      FROM subscriptions s
      INNER JOIN plans p ON p.id = s.plan_id
      WHERE s.tenant_id = $1
        AND trim(s.status::text) IN ('active', 'trial', 'past_due')
      LIMIT 1
      `,
      [tenantId]
    );
    return result.rows[0] ?? null;
  }

  /**
   * Same row shape as `getSubscriptionPlan`, but includes `canceled` (for billing UI).
   */
  async getSubscriptionPlanAnyStatus(
    tenantId: string,
    executor: Queryable = this.db
  ): Promise<SubscriptionPlanRow | null> {
    const caps = await getBillingSubscriptionCaps(this.db);
    const maxUsersSql = caps.maxUsersColumn ? 's.max_users' : 'NULL::integer';
    const tierSql = caps.planColumn
      ? `COALESCE(NULLIF(trim(s.plan::text), ''), lower(p.name))`
      : `lower(p.name)`;
    const trialSql = caps.trialEndsAtColumn ? 's.trial_ends_at' : 'NULL::timestamptz';
    const tasksLimitSql = caps.trialEndsAtColumn ? 's.tasks_limit' : 'NULL::integer';
    const apiLimitSql = caps.trialEndsAtColumn ? 's.api_limit' : 'NULL::integer';

    const result = await executor.query<SubscriptionPlanRow>(
      `
      SELECT
        p.id AS plan_id,
        p.name AS plan_name,
        p.limits,
        ${maxUsersSql} AS subscription_max_users,
        ${tierSql} AS subscription_plan_tier,
        trim(s.status::text) AS subscription_status,
        ${trialSql} AS trial_ends_at,
        ${tasksLimitSql} AS tasks_limit,
        ${apiLimitSql} AS api_limit
      FROM subscriptions s
      INNER JOIN plans p ON p.id = s.plan_id
      WHERE s.tenant_id = $1
      LIMIT 1
      `,
      [tenantId]
    );
    return result.rows[0] ?? null;
  }

  async getBasicPlanFallback(executor: Queryable = this.db): Promise<SubscriptionPlanRow> {
    const result = await executor.query<SubscriptionPlanRow>(
      `
      SELECT
        id AS plan_id,
        name AS plan_name,
        limits,
        NULL::integer AS subscription_max_users,
        lower(name) AS subscription_plan_tier,
        'active' AS subscription_status,
        NULL::timestamptz AS trial_ends_at,
        NULL::integer AS tasks_limit,
        NULL::integer AS api_limit
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

  /**
   * Active manager + employee seats (owner excluded). Uses `tenant_users` with legacy `users.role` fallback.
   */
  async countBillableTenantMembers(tenantId: string, executor: Queryable = this.db): Promise<number> {
    const caps = await getAuthSchemaCaps(this.db);
    const systemRoleSql = caps.usersSystemRoleColumn
      ? `COALESCE(u.system_role::text, 'user')`
      : `'user'::text`;

    const sql = caps.tenantUsersTable
      ? `
      SELECT COUNT(*)::text AS total
      FROM users u
      LEFT JOIN tenant_users tu ON tu.user_id = u.id AND tu.tenant_id = $1
      WHERE u.is_active = TRUE
        AND (u.tenant_id = $1 OR tu.user_id IS NOT NULL)
        AND ${systemRoleSql} IS DISTINCT FROM 'super_admin'
        AND (
          COALESCE(
            tu.role::text,
            CASE UPPER(TRIM(u.role::text))
              WHEN 'ADMIN' THEN 'owner'
              WHEN 'MANAGER' THEN 'manager'
              ELSE 'employee'
            END
          )
        ) <> 'owner'
      `
      : `
      SELECT COUNT(*)::text AS total
      FROM users u
      WHERE u.tenant_id = $1
        AND u.is_active = TRUE
        AND ${systemRoleSql} IS DISTINCT FROM 'super_admin'
        AND (
          CASE UPPER(TRIM(u.role::text))
            WHEN 'ADMIN' THEN 'owner'
            WHEN 'MANAGER' THEN 'manager'
            ELSE 'employee'
          END
        ) <> 'owner'
      `;

    const result = await executor.query<{ total: string }>(sql, [tenantId]);
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

  async createPaymentRequest(data: {
    tenantId: string;
    userId: string;
    planId: string;
    amount: number;
    executor?: Queryable;
  }): Promise<PendingPaymentRequestRow> {
    const executor = data.executor ?? this.db;
    const result = await executor.query<PendingPaymentRequestRow>(
      `
      INSERT INTO payment_requests (
        tenant_id,
        user_id,
        plan_id,
        amount,
        status,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, 'pending', NOW(), NOW())
      RETURNING
        id,
        (SELECT name FROM plans WHERE id = payment_requests.plan_id) AS plan_name,
        status,
        amount::text,
        created_at
      `,
      [data.tenantId, data.userId, data.planId, data.amount]
    );
    return result.rows[0];
  }

  async getPlanByName(
    planName: 'basic' | 'pro' | 'business' | 'enterprise',
    executor: Queryable = this.db
  ): Promise<{ id: string; name: string; price: string | null } | null> {
    const hasPrice = await this.hasPlansPriceColumn(executor);
    const result = await executor.query<{ id: string; name: string; price: string | null }>(
      hasPrice
        ? `
      SELECT id, name, price::text AS price
      FROM plans
      WHERE name = $1
      LIMIT 1
      `
        : `
      SELECT id, name, NULL::text AS price
      FROM plans
      WHERE name = $1
      LIMIT 1
      `,
      [planName]
    );
    return result.rows[0] ?? null;
  }

  private async hasPlansPriceColumn(executor: Queryable = this.db): Promise<boolean> {
    if (this.plansPriceColumnCache !== null) {
      return this.plansPriceColumnCache;
    }
    const result = await executor.query<{ exists: boolean }>(
      `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'plans'
          AND column_name = 'price'
      ) AS exists
      `
    );
    this.plansPriceColumnCache = Boolean(result.rows[0]?.exists);
    return this.plansPriceColumnCache;
  }

  async getPlanNameById(
    planId: string,
    executor: Queryable = this.db
  ): Promise<'basic' | 'pro' | 'business' | 'enterprise' | null> {
    const result = await executor.query<{ name: string }>(
      `
      SELECT name
      FROM plans
      WHERE id = $1
      LIMIT 1
      `,
      [planId]
    );
    const name = result.rows[0]?.name;
    if (name !== 'basic' && name !== 'pro' && name !== 'business' && name !== 'enterprise') {
      return null;
    }
    return name;
  }

  async getPendingPaymentRequestForTenant(
    tenantId: string,
    executor: Queryable = this.db
  ): Promise<PendingPaymentRequestRow | null> {
    const result = await executor.query<PendingPaymentRequestRow>(
      `
      SELECT
        pr.id,
        p.name AS plan_name,
        pr.status,
        pr.amount::text,
        pr.created_at
      FROM payment_requests pr
      INNER JOIN plans p ON p.id = pr.plan_id
      WHERE pr.tenant_id = $1
        AND pr.status = 'pending'
      ORDER BY pr.created_at DESC
      LIMIT 1
      `,
      [tenantId]
    );
    return result.rows[0] ?? null;
  }

  async getPaymentRequestById(
    paymentRequestId: string,
    executor: Queryable = this.db
  ): Promise<{ id: string; tenant_id: string; plan_id: string; status: string } | null> {
    const result = await executor.query<{
      id: string;
      tenant_id: string;
      plan_id: string;
      status: string;
    }>(
      `
      SELECT id, tenant_id, plan_id, status::text AS status
      FROM payment_requests
      WHERE id = $1
      LIMIT 1
      `,
      [paymentRequestId]
    );
    return result.rows[0] ?? null;
  }

  async approvePaymentRequest(
    paymentRequestId: string,
    approverUserId: string,
    executor: Queryable = this.db
  ): Promise<boolean> {
    const result = await executor.query(
      `
      UPDATE payment_requests
      SET
        status = 'approved',
        confirmed_by = $2,
        confirmed_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
        AND status = 'pending'
      `,
      [paymentRequestId, approverUserId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async rejectPaymentRequest(
    paymentRequestId: string,
    approverUserId: string,
    adminNote?: string,
    executor: Queryable = this.db
  ): Promise<boolean> {
    const result = await executor.query(
      `
      UPDATE payment_requests
      SET
        status = 'rejected',
        confirmed_by = $2,
        confirmed_at = NOW(),
        admin_note = $3,
        updated_at = NOW()
      WHERE id = $1
        AND status = 'pending'
      `,
      [paymentRequestId, approverUserId, adminNote ?? null]
    );
    return (result.rowCount ?? 0) > 0;
  }

  private async tenantColumnExists(
    columnName: 'plan_id' | 'plan',
    executor: Queryable = this.db
  ): Promise<boolean> {
    const result = await executor.query<{ has_column: boolean }>(
      `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'tenants'
          AND column_name = $1
      ) AS has_column
      `,
      [columnName]
    );
    return result.rows[0]?.has_column ?? false;
  }

  async syncTenantPlan(tenantId: string, planId: string, executor: Queryable = this.db): Promise<void> {
    const [hasPlanId, hasPlan] = await Promise.all([
      this.tenantColumnExists('plan_id', executor),
      this.tenantColumnExists('plan', executor),
    ]);

    if (hasPlanId) {
      await executor.query(
        `
        UPDATE tenants
        SET plan_id = $2, updated_at = NOW()
        WHERE id = $1
        `,
        [tenantId, planId]
      );
    }

    if (hasPlan) {
      await executor.query<{ name: string }>(
        `
        UPDATE tenants t
        SET
          plan = CASE
            WHEN p.name = 'basic' THEN 'FREE'
            WHEN p.name = 'pro' THEN 'PRO'
            ELSE 'ENTERPRISE'
          END,
          updated_at = NOW()
        FROM plans p
        WHERE t.id = $1
          AND p.id = $2
        `,
        [tenantId, planId]
      );
    }
  }

  /**
   * Switch plan (owner upgrade): sync `plan_id`, denormalized caps, `active`, billing period.
   */
  async upgradeSubscriptionToPlan(
    tenantId: string,
    planName: 'basic' | 'pro' | 'business' | 'enterprise',
    executor: Queryable = this.db
  ): Promise<{ updated: boolean }> {
    const caps = await getBillingSubscriptionCaps(this.db);
    if (caps.planColumn && caps.maxUsersColumn && caps.trialEndsAtColumn) {
      const result = await executor.query(
        `
        UPDATE subscriptions s
        SET
          plan_id = p.id,
          plan = $2::subscription_plan_tier,
          max_users = CASE
            WHEN jsonb_typeof(p.limits->'users') = 'null' OR (p.limits->>'users') IS NULL THEN NULL
            ELSE (NULLIF(p.limits->>'users', 'null'))::integer
          END,
          tasks_limit = CASE
            WHEN jsonb_typeof(p.limits->'tasks') = 'null' OR (p.limits->>'tasks') IS NULL THEN NULL
            ELSE (NULLIF(p.limits->>'tasks', 'null'))::integer
          END,
          api_limit = CASE
            WHEN jsonb_typeof(p.limits->'api_rate_per_hour') = 'null'
              OR (p.limits->>'api_rate_per_hour') IS NULL
            THEN NULL
            ELSE (NULLIF(p.limits->>'api_rate_per_hour', 'null'))::integer
          END,
          status = 'active'::subscription_status,
          current_period_end = NOW() + INTERVAL '15 days',
          trial_ends_at = NULL,
          updated_at = NOW()
        FROM plans p
        WHERE s.tenant_id = $1
          AND p.name = $2
        `,
        [tenantId, planName]
      );
      const updated = (result.rowCount ?? 0) > 0;
      if (updated) {
        const plan = await this.getPlanByName(planName, executor);
        if (plan) {
          await this.syncTenantPlan(tenantId, plan.id, executor);
        }
      }
      return { updated };
    }

    if (caps.planColumn && caps.maxUsersColumn) {
      const result = await executor.query(
        `
        UPDATE subscriptions s
        SET
          plan_id = p.id,
          plan = $2::subscription_plan_tier,
          max_users = CASE
            WHEN jsonb_typeof(p.limits->'users') = 'null' OR (p.limits->>'users') IS NULL THEN NULL
            ELSE (NULLIF(p.limits->>'users', 'null'))::integer
          END,
          status = 'active',
          updated_at = NOW()
        FROM plans p
        WHERE s.tenant_id = $1
          AND p.name = $2
        `,
        [tenantId, planName]
      );
      const updated = (result.rowCount ?? 0) > 0;
      if (updated) {
        const plan = await this.getPlanByName(planName, executor);
        if (plan) {
          await this.syncTenantPlan(tenantId, plan.id, executor);
        }
      }
      return { updated };
    }

    const result = await executor.query(
      `
      UPDATE subscriptions s
      SET
        plan_id = p.id,
        status = 'active',
        updated_at = NOW()
      FROM plans p
      WHERE s.tenant_id = $1
        AND p.name = $2
      `,
      [tenantId, planName]
    );
    const updated = (result.rowCount ?? 0) > 0;
    if (updated) {
      const plan = await this.getPlanByName(planName, executor);
      if (plan) {
        await this.syncTenantPlan(tenantId, plan.id, executor);
      }
    }
    return { updated };
  }
}
