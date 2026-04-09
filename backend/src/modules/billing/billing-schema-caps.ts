import type { Pool } from 'pg';

export interface BillingSubscriptionCaps {
  planColumn: boolean;
  maxUsersColumn: boolean;
}

let cached: BillingSubscriptionCaps | null = null;
let inflight: Promise<BillingSubscriptionCaps> | null = null;

/**
 * `20260409120000_saas_billing` creates `subscriptions` without `plan` / `max_users`;
 * `20260410120000_system_tenant_roles` adds them. Billing code must work with either shape.
 */
export function getBillingSubscriptionCaps(db: Pool): Promise<BillingSubscriptionCaps> {
  if (cached) {
    return Promise.resolve(cached);
  }
  if (!inflight) {
    inflight = (async () => {
      try {
        const r = await db.query<{ pc: boolean; mc: boolean }>(
          `
          SELECT
            EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'subscriptions'
                AND column_name = 'plan'
            ) AS pc,
            EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'subscriptions'
                AND column_name = 'max_users'
            ) AS mc
          `
        );
        cached = {
          planColumn: Boolean(r.rows[0]?.pc),
          maxUsersColumn: Boolean(r.rows[0]?.mc),
        };
      } catch {
        cached = { planColumn: false, maxUsersColumn: false };
      }
      return cached;
    })();
  }
  return inflight;
}
