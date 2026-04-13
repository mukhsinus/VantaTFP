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
    status: 'pending' | 'approved' | 'rejected';
    amount: number;
    created_at: string;
  } | null;
}

export type BillingPlanId = 'basic' | 'pro' | 'business' | 'enterprise';

export type BillingPlanCatalogItem =
  | { name: 'basic'; price: number; users: number; tasks: number }
  | { name: 'pro'; price: number; users: number; tasks: number }
  | { name: 'business'; price: number; users: number; tasks: number }
  | { name: 'enterprise'; price: number };

export type BillingPlansCatalogDto = BillingPlanCatalogItem[];
