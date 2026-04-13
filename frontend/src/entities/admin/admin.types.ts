export interface AdminPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasMore: boolean;
}

export interface AdminListResponse<T> {
  data: T[];
  pagination: AdminPagination;
}

export interface PaymentRequest {
  id: string;
  tenant_id: string;
  tenant: string;
  plan_id: string;
  plan: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  billing_status: string | null;
  created_at: string;
}

export interface AdminSubscription {
  tenant_id: string;
  tenant: string;
  status: string;
  plan: string | null;
  limits: Record<string, unknown> | null;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  system_role: string;
  tenant_role: string | null;
  role: string;
  tenant_id: string | null;
  tenant_name: string | null;
  is_active: boolean;
}

export interface AdminDashboardSummary {
  totalTenants: number;
  activeSubscriptions: number;
  pendingPayments: number;
  mrr: number;
}
