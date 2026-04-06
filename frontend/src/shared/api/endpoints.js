/**
 * Single source of truth for all backend API paths.
 * Never write raw strings in API calls — always reference this file.
 */
export const API = {
    auth: {
        login: '/api/v1/auth/login',
        register: '/api/v1/auth/register',
        refresh: '/api/v1/auth/refresh',
    },
    users: {
        me: '/api/v1/users/me',
        list: '/api/v1/users',
        detail: (userId) => `/api/v1/users/${userId}`,
    },
    tenants: {
        list: '/api/v1/tenants',
        detail: (tenantId) => `/api/v1/tenants/${tenantId}`,
    },
    tasks: {
        list: '/api/v1/tasks',
        detail: (taskId) => `/api/v1/tasks/${taskId}`,
        // PATCH /tasks/:id handles both field updates and status changes
        update: (taskId) => `/api/v1/tasks/${taskId}`,
    },
    kpi: {
        list: '/api/v1/kpi',
        detail: (kpiId) => `/api/v1/kpi/${kpiId}`,
        progress: (kpiId) => `/api/v1/kpi/${kpiId}/progress`,
    },
    payroll: {
        list: '/api/v1/payroll',
        detail: (payrollId) => `/api/v1/payroll/${payrollId}`,
        approve: (payrollId) => `/api/v1/payroll/${payrollId}/approve`,
    },
};
