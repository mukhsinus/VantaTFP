export interface PlanLimits {
  /** null = unlimited */
  users: number | null;
  /** null = unlimited */
  tasks: number | null;
  api_rate_per_hour: number;
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
