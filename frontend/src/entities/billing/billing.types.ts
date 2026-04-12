export interface BillingLimitView {
  users: number | null;
  tasks: number | null;
  apiRatePerHour: number;
}

export interface BillingSnapshotDto {
  tenantId: string;
  planName: string;
  limits: BillingLimitView;
  usage: {
    users: number;
    tasks: number;
    apiRatePerHour: number;
  };
}

/** GET /api/v1/billing/current — snake_case from API `data`. */
export interface BillingCurrentDto {
  plan: string;
  status: string | null;
  trial_ends_at: string | null;
  users_used: number;
  users_limit: number | null;
  tasks_used: number;
  tasks_limit: number | null;
  api_used: number;
  api_limit: number | null;
}

export type BillingPlanId = 'basic' | 'pro' | 'unlimited';

export type BillingPlanCatalogItem =
  | { name: 'basic'; price: number; users: number; tasks: number }
  | { name: 'pro'; price: number; users: number; tasks: number }
  | { name: 'unlimited'; price: number };

export type BillingPlansCatalogDto = BillingPlanCatalogItem[];
