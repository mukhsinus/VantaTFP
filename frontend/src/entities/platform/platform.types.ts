export interface PlatformPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasMore: boolean;
}

export interface PlatformTenantRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformUserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  systemRole: string;
  tenantId: string | null;
  tenantName: string | null;
  createdAt: string;
}

export interface PlatformSubscriptionRow {
  tenantId: string;
  tenantName: string;
  status: string;
  planTier: string | null;
  planName: string | null;
  maxUsers: number | null;
}

export interface PlatformListResponse<T> {
  data: T[];
  pagination: PlatformPagination;
}
