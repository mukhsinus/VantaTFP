import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type {
  AdminDashboardSummary,
  AdminListResponse,
  AdminSubscription,
  AdminTenant,
  AdminUser,
  PaymentRequest,
} from './admin.types';

export const adminApi = {
  getDashboard: () => apiClient.get<AdminDashboardSummary>(API.admin.dashboard),

  listPayments: (params?: {
    status?: 'pending' | 'approved' | 'rejected';
    page?: number;
    limit?: number;
  }) => apiClient.get<AdminListResponse<PaymentRequest>>(API.admin.payments, params),

  approvePayment: (id: string) => apiClient.post(API.admin.approvePayment(id)),
  rejectPayment: (id: string) => apiClient.post(API.admin.rejectPayment(id)),

  listSubscriptions: (params?: { page?: number; limit?: number }) =>
    apiClient.get<AdminListResponse<AdminSubscription>>(API.admin.subscriptions, params),

  listTenants: (params?: { page?: number; limit?: number }) =>
    apiClient.get<AdminListResponse<AdminTenant>>(API.admin.tenants, params),
  suspendTenant: (id: string) => apiClient.patch(API.admin.suspendTenant(id)),
  activateTenant: (id: string) => apiClient.patch(API.admin.activateTenant(id)),
  setTenantPlan: (id: string, plan: 'basic' | 'pro' | 'business' | 'enterprise') =>
    apiClient.post(API.admin.setTenantPlan(id), { plan }),

  listUsers: (params?: { page?: number; limit?: number }) =>
    apiClient.get<AdminListResponse<AdminUser>>(API.admin.users, params),
  updateUserRole: (id: string, role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE') =>
    apiClient.post(API.admin.updateUserRole(id), { role }),
  banUser: (id: string) => apiClient.post(API.admin.banUser(id)),
};
