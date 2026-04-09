import type { PoolClient } from 'pg';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { env } from '../../shared/utils/env.js';
import { BillingRepository } from './billing.repository.js';
import type {
  LimitCheckResult,
  PlanLimitMetric,
  PlanLimits,
  TenantPlanContext,
} from './billing.types.js';
import type { SubscriptionPlanRow } from './billing.repository.js';

/** Seat cap for manager+employee (owner excluded). `null` = unlimited. */
export function effectiveBillableSeatLimit(
  subscriptionPlanTier: string,
  subscriptionMaxUsers: number | null | undefined
): number | null {
  const tier = subscriptionPlanTier.toLowerCase();
  if (tier === 'unlimited') return null;
  if (subscriptionMaxUsers !== null && subscriptionMaxUsers !== undefined) {
    return subscriptionMaxUsers;
  }
  if (tier === 'basic') return 5;
  if (tier === 'pro') return 15;
  return null;
}

function utcHourStart(d = new Date()): Date {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      d.getUTCHours(),
      0,
      0,
      0
    )
  );
}

function parseLimits(raw: unknown): PlanLimits {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid plan limits payload');
  }
  const o = raw as Record<string, unknown>;
  const users =
    o.users === null || o.users === undefined ? null : Number(o.users);
  const tasks =
    o.tasks === null || o.tasks === undefined ? null : Number(o.tasks);
  const apiRate = Number(o.api_rate_per_hour);
  if (users !== null && (Number.isNaN(users) || users < 0)) {
    throw new Error('Invalid users limit');
  }
  if (tasks !== null && (Number.isNaN(tasks) || tasks < 0)) {
    throw new Error('Invalid tasks limit');
  }
  if (Number.isNaN(apiRate) || apiRate < 0) {
    throw new Error('Invalid api_rate_per_hour');
  }
  return {
    users,
    tasks,
    api_rate_per_hour: apiRate,
  };
}

function shouldApplyTenantApiRate(url: string): boolean {
  if (url === '/health' || url.startsWith('/health?')) {
    return false;
  }
  if (!url.startsWith('/api/v1/')) {
    return false;
  }
  if (url.startsWith('/api/v1/auth')) {
    return false;
  }
  // UI hydration-critical endpoints should never be blocked by API-rate checks.
  if (url.startsWith('/api/v1/users/me')) return false;
  if (url.startsWith('/api/v1/notifications/unread')) return false;
  if (url.startsWith('/api/v1/kpi/')) return false;
  if (url.startsWith('/api/v1/tasks')) return false;
  return true;
}

export class BillingService {
  constructor(private readonly repo: BillingRepository) {}

  private rowToTenantContext(row: SubscriptionPlanRow): TenantPlanContext {
    const limits = parseLimits(row.limits);
    const billableSeatLimit = effectiveBillableSeatLimit(
      row.subscription_plan_tier,
      row.subscription_max_users
    );
    return {
      planId: row.plan_id,
      planName: row.plan_name,
      limits,
      billableSeatLimit,
    };
  }

  async getTenantPlan(tenantId: string): Promise<TenantPlanContext> {
    await this.repo.ensureDefaultSubscription(tenantId);
    let row = await this.repo.getSubscriptionPlan(tenantId);
    if (!row) {
      row = await this.repo.getBasicPlanFallback();
    }
    return this.rowToTenantContext(row);
  }

  /**
   * Whether the tenant may add another manager/employee (owner does not consume a seat).
   */
  async canAddUser(
    tenantId: string
  ): Promise<{ allowed: boolean; current: number; max: number | null }> {
    const plan = await this.getTenantPlan(tenantId);
    const max = plan.billableSeatLimit;
    const current = await this.repo.countBillableTenantMembers(tenantId);
    const allowed = max === null || current < max;
    return { allowed, current, max };
  }

  async checkLimit(
    tenantId: string,
    metric: PlanLimitMetric
  ): Promise<LimitCheckResult> {
    const plan = await this.getTenantPlan(tenantId);
    if (metric === 'users') {
      const max = plan.billableSeatLimit;
      const current = await this.repo.countBillableTenantMembers(tenantId);
      const allowed = max === null || current < max;
      return { allowed, current, max };
    }
    if (metric === 'tasks') {
      const max = plan.limits.tasks;
      const current = await this.repo.countTasks(tenantId);
      const allowed = max === null || current < max;
      return { allowed, current, max };
    }
    const max = plan.limits.api_rate_per_hour;
    const periodStart = utcHourStart();
    const current = await this.repo.getApiUsageForPeriod(tenantId, periodStart);
    const allowed = current < max;
    return { allowed, current, max };
  }

  async assertCanAddUser(tenantId: string): Promise<void> {
    const { allowed } = await this.canAddUser(tenantId);
    if (!allowed) {
      throw ApplicationError.planLimitExceeded('User limit reached');
    }
  }

  async assertCanAddTask(tenantId: string): Promise<void> {
    const { allowed } = await this.checkLimit(tenantId, 'tasks');
    if (!allowed) {
      throw ApplicationError.planLimitExceeded(
        'Task limit reached for your subscription plan'
      );
    }
  }

  /**
   * Per-tenant API quota (hourly), applied after JWT auth. Complements global/IP rate limiting.
   */
  async enforceTenantApiRate(requestUrl: string, tenantId: string): Promise<void> {
    console.log('Billing check start');
    if (!shouldApplyTenantApiRate(requestUrl)) {
      return;
    }
    const plan = await this.getTenantPlan(tenantId);
    const effectiveLimit =
      env.NODE_ENV === 'development'
        ? Math.max(plan.limits.api_rate_per_hour, env.BILLING_DEV_API_RATE_LIMIT)
        : plan.limits.api_rate_per_hour;
    const periodStart = utcHourStart();
    const newCount = await this.repo.incrementApiUsage(tenantId, periodStart);
    if (newCount > effectiveLimit) {
      if (!env.BILLING_STRICT_MODE || env.NODE_ENV === 'development') {
        console.warn(
          `[billing] soft-limit exceeded for tenant ${tenantId}: ${newCount}/${effectiveLimit} on ${requestUrl}`
        );
        return;
      }
      throw ApplicationError.planLimitExceeded('API rate limit exceeded for your subscription plan');
    }
  }

  async runAtomicUserCreation<T>(
    tenantId: string,
    options: { occupiesBillableSeat: boolean },
    insertEntity: (tx: PoolClient) => Promise<T>
  ): Promise<T> {
    return this.repo.withTransaction(async (tx) => {
      await this.repo.lockTenantMetric(tenantId, 'users', tx);
      const plan = await this.getTenantPlanInTx(tenantId, tx);
      const max = plan.billableSeatLimit;

      if (options.occupiesBillableSeat && max !== null) {
        const before = await this.repo.countBillableTenantMembers(tenantId, tx);
        if (before >= max) {
          throw ApplicationError.planLimitExceeded('User limit reached');
        }
      }

      const created = await insertEntity(tx);
      await this.repo.incrementUsage(tenantId, utcHourStart(), 'users', tx);

      if (options.occupiesBillableSeat && max !== null) {
        const after = await this.repo.countBillableTenantMembers(tenantId, tx);
        if (after > max) {
          throw ApplicationError.planLimitExceeded('User limit reached');
        }
      }

      return created;
    });
  }

  async runAtomicTaskCreation<T>(
    tenantId: string,
    insertEntity: (tx: PoolClient) => Promise<T>
  ): Promise<T> {
    return this.repo.withTransaction(async (tx) => {
      await this.repo.lockTenantMetric(tenantId, 'tasks', tx);
      const plan = await this.getTenantPlanInTx(tenantId, tx);
      const max = plan.limits.tasks;
      const current = await this.repo.countTasks(tenantId, tx);
      if (max !== null && current >= max) {
        throw ApplicationError.planLimitExceeded('Task limit reached for your subscription plan');
      }

      const created = await insertEntity(tx);
      const tracked = await this.repo.incrementUsage(tenantId, utcHourStart(), 'tasks', tx);
      const finalCount = await this.repo.countTasks(tenantId, tx);

      if ((max !== null && finalCount > max) || (max !== null && tracked > max)) {
        throw ApplicationError.planLimitExceeded('Task limit reached for your subscription plan');
      }

      return created;
    });
  }

  async ensureSubscriptionForNewTenant(tenantId: string): Promise<void> {
    await this.repo.ensureDefaultSubscription(tenantId);
  }

  private async getTenantPlanInTx(
    tenantId: string,
    tx: PoolClient
  ): Promise<TenantPlanContext> {
    await this.repo.ensureDefaultSubscription(tenantId, tx);
    let row = await this.repo.getSubscriptionPlan(tenantId, tx);
    if (!row) {
      row = await this.repo.getBasicPlanFallback(tx);
    }
    return this.rowToTenantContext(row);
  }
}
