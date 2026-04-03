/**
 * Single source of truth for all backend API paths.
 * Never write raw strings in API calls — always reference this file.
 */
export const API = {
  auth: {
    login:   '/api/v1/auth/login',
    register:'/api/v1/auth/register',
    refresh: '/api/v1/auth/refresh',
  },

  users: {
    me:     '/api/v1/users/me',
    list:   '/api/v1/users',
    detail: (userId: string) => `/api/v1/users/${userId}`,
  },

  tenants: {
    list:   '/api/v1/tenants',
    detail: (tenantId: string) => `/api/v1/tenants/${tenantId}`,
  },

  tasks: {
    list:   '/api/v1/tasks',
    detail: (taskId: string) => `/api/v1/tasks/${taskId}`,
    // PATCH /tasks/:id handles both field updates and status changes
    update: (taskId: string) => `/api/v1/tasks/${taskId}`,
  },

  kpi: {
    list:     '/api/v1/kpi',
    detail:   (kpiId: string) => `/api/v1/kpi/${kpiId}`,
    progress: (kpiId: string) => `/api/v1/kpi/${kpiId}/progress`,
  },

  payroll: {
    list:    '/api/v1/payroll',
    detail:  (payrollId: string) => `/api/v1/payroll/${payrollId}`,
    approve: (payrollId: string) => `/api/v1/payroll/${payrollId}/approve`,
  },
} as const;
