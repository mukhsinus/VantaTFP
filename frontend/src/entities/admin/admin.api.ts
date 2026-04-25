import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type {
  AdminAuditLog,
  AdminDashboardSummary,
  AdminListResponse,
  AdminSubscription,
  AdminSystemHealth,
  AdminTenantManagement,
  AdminTenantStats,
  AdminTenant,
  AdminUser,
  PaymentRequest,
} from './admin.types';

function withTenantScope(path: string, tenantId: string): string {
  const value = tenantId.trim();
  if (!value) {
    throw new Error('tenantId is required');
  }
  return `${path}?tenantId=${encodeURIComponent(value)}`;
}

export const adminApi = {
  getDashboard: (params?: { tenantId?: string }) =>
    apiClient.get<AdminDashboardSummary>(API.admin.dashboard, params),

  getTenantAuditLogs: (
    tenantId: string,
    params?: { action?: string; entity?: string; userId?: string; page?: number; limit?: number }
  ) =>
    apiClient.get<AdminListResponse<AdminAuditLog>>(
      withTenantScope(API.admin.auditLogs, tenantId),
      params
    ),

  getTenantManagement: (tenantId: string) =>
    apiClient.get<AdminTenantManagement>(withTenantScope(API.admin.tenant, tenantId)),

  updateTenantManagement: (
    tenantId: string,
    body: { name?: string; plan?: 'FREE' | 'PRO' | 'ENTERPRISE' }
  ) => apiClient.patch<AdminTenantManagement>(withTenantScope(API.admin.tenant, tenantId), body),

  deactivateTenantManagement: (tenantId: string) =>
    apiClient.post<void>(withTenantScope(API.admin.deactivateTenantScope, tenantId)),

  getSystemHealth: () =>
    apiClient.get<AdminSystemHealth>(API.admin.monitoringHealth),

  getTenantStats: (tenantId: string) =>
    apiClient.get<AdminTenantStats>(withTenantScope(API.admin.monitoringStats, tenantId)),

  listPayments: (params?: {
    status?: 'pending' | 'approved' | 'rejected';
    page?: number;
    limit?: number;
    tenantId?: string;
  }) => apiClient.get<AdminListResponse<PaymentRequest>>(API.admin.payments, params),

  approvePayment: (id: string) => apiClient.post(API.admin.approvePayment(id)),
  rejectPayment: (id: string) => apiClient.post(API.admin.rejectPayment(id)),

  listSubscriptions: (params?: { page?: number; limit?: number; tenantId?: string }) =>
    apiClient.get<AdminListResponse<AdminSubscription>>(API.admin.subscriptions, params),

  listTenants: (params?: { page?: number; limit?: number }) =>
    apiClient.get<AdminListResponse<AdminTenant>>(API.admin.tenants, params),
  suspendTenant: (id: string) => apiClient.patch(API.admin.suspendTenant(id)),
  activateTenant: (id: string) => apiClient.patch(API.admin.activateTenant(id)),
  setTenantPlan: (id: string, plan: 'basic' | 'pro' | 'business' | 'enterprise') =>
    apiClient.post(API.admin.setTenantPlan(id), { plan }),

  listUsers: (params?: { page?: number; limit?: number; tenantId?: string }) =>
    apiClient.get<AdminListResponse<AdminUser>>(API.admin.users, params),
  updateUserRole: (id: string, role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE') =>
    apiClient.post(API.admin.updateUserRole(id), { role }),
  banUser: (id: string) => apiClient.post(API.admin.banUser(id)),
};
