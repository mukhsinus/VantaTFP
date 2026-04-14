import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
export const adminApi = {
    getDashboard: () => apiClient.get(API.admin.dashboard),
    listPayments: (params) => apiClient.get(API.admin.payments, params),
    approvePayment: (id) => apiClient.post(API.admin.approvePayment(id)),
    rejectPayment: (id) => apiClient.post(API.admin.rejectPayment(id)),
    listSubscriptions: (params) => apiClient.get(API.admin.subscriptions, params),
    listTenants: (params) => apiClient.get(API.admin.tenants, params),
    suspendTenant: (id) => apiClient.patch(API.admin.suspendTenant(id)),
    activateTenant: (id) => apiClient.patch(API.admin.activateTenant(id)),
    setTenantPlan: (id, plan) => apiClient.post(API.admin.setTenantPlan(id), { plan }),
    listUsers: (params) => apiClient.get(API.admin.users, params),
    updateUserRole: (id, role) => apiClient.post(API.admin.updateUserRole(id), { role }),
    banUser: (id) => apiClient.post(API.admin.banUser(id)),
};
