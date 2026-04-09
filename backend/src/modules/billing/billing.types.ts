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
}

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  max: number | null;
}
