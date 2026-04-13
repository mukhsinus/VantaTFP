export interface PlanLimits {
  /** null = unlimited */
  users: number | null;
  /** null = unlimited */
  tasks: number | null;
  /** null = unlimited (no per-tenant hourly API cap) */
  api_rate_per_hour: number | null;
}

export type PlanLimitMetric = 'users' | 'tasks' | 'api_requests';

export interface TenantPlanContext {
  planId: string;
  planName: string;
  limits: PlanLimits;
  /**
   * Max manager+employee seats (owner excluded). `null` = unlimited.
   * Derived from subscription tier + `subscriptions.max_users`.
   */
  billableSeatLimit: number | null;
}

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  max: number | null;
}

/** Resolved caps for a tenant (billing helper). */
export interface TenantLimitsSnapshot {
  users_limit: number | null;
  tasks_limit: number | null;
  api_limit: number | null;
  is_trial: boolean;
  trial_ends_at: string | null;
}

/** GET /billing/current (snake_case JSON). */
export interface BillingCurrentResponse {
  plan: {
    id: string;
    name: string;
  };
  limits: {
    users: number | null;
    tasks: number | null;
    api_rate_per_hour: number | null;
  };
  usage: {
    users: number;
    tasks: number;
    api_requests: number;
  };
  status: string | null;
  trial_ends_at: string | null;
  pending_payment: {
    id: string;
    plan: string;
    status: 'pending' | 'approved' | 'rejected';
    amount: number;
    created_at: string;
  } | null;
  available_plans: BillingPlanCatalogEntry[];
  renewal_date?: string | null;
  payment_method?: string | null;
}

export type BillingPlanCatalogName = 'basic' | 'pro' | 'business' | 'enterprise';

export type BillingPlanCatalogEntry =
  | { name: 'basic'; price: number; users: number; tasks: number }
  | { name: 'pro'; price: number; users: number; tasks: number }
  | { name: 'business'; price: number; users: number; tasks: number }
  | { name: 'enterprise'; price: number; users: number; tasks: number };
