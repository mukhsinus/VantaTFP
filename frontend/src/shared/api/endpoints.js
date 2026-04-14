/**
 * Single source of truth for all backend API paths.
 * Never write raw strings in API calls — always reference this file.
 */
export const API = {
    auth: {
        login: '/api/v1/auth/login',
        register: '/api/v1/auth/register',
        registerEmployer: '/api/v1/auth/register-employer',
        refresh: '/api/v1/auth/refresh',
    },
    users: {
        me: '/api/v1/users/me',
        profile: '/api/v1/users/profile',
        password: '/api/v1/users/password',
        notifications: '/api/v1/users/me/notifications',
        list: '/api/v1/users',
        detail: (userId) => `/api/v1/users/${userId}`,
    },
    employees: {
        list: '/api/v1/employees',
        create: '/api/v1/employees/create',
        detail: (userId) => `/api/v1/employees/${userId}`,
        patchRole: (userId) => `/api/v1/employees/${userId}/role`,
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
        analyticsByEmployee: '/api/v1/kpi/analytics/by-employee',
        analyticsAggregated: '/api/v1/kpi/analytics/aggregated',
    },
    payroll: {
        list: '/api/v1/payroll',
        detail: (payrollId) => `/api/v1/payroll/${payrollId}`,
        approve: (payrollId) => `/api/v1/payroll/${payrollId}/approve`,
        rules: '/api/v1/payroll/rules',
        ruleDetail: (ruleId) => `/api/v1/payroll/rules/${ruleId}`,
        applyRule: (ruleId) => `/api/v1/payroll/rules/${ruleId}/apply`,
        records: '/api/v1/payroll/records',
    },
    reports: {
        generate: '/api/v1/reports/generate',
        export: '/api/v1/reports/export',
        history: '/api/v1/reports/history',
    },
    notifications: {
        unread: '/api/v1/notifications/unread',
        ws: '/api/v1/notifications/ws',
    },
    billing: {
        snapshot: '/api/v1/billing/snapshot',
        current: '/api/v1/billing/current',
        plans: '/api/v1/billing/plans',
        upgrade: '/api/v1/billing/upgrade',
    },
    /** Platform operator API (`requireSystemRole('super_admin')`). */
    platform: {
        tenants: '/api/v1/platform/tenants',
        users: '/api/v1/platform/users',
        subscriptions: '/api/v1/platform/subscriptions',
    },
    admin: {
        dashboard: '/api/v1/admin/dashboard',
        payments: '/api/v1/admin/payments',
        approvePayment: (paymentId) => `/api/v1/admin/payments/${paymentId}/approve`,
        rejectPayment: (paymentId) => `/api/v1/admin/payments/${paymentId}/reject`,
        tenants: '/api/v1/admin/tenants',
        suspendTenant: (tenantId) => `/api/v1/admin/tenants/${tenantId}/suspend`,
        activateTenant: (tenantId) => `/api/v1/admin/tenants/${tenantId}/activate`,
        setTenantPlan: (tenantId) => `/api/v1/admin/tenants/${tenantId}/plan`,
        subscriptions: '/api/v1/admin/subscriptions',
        users: '/api/v1/admin/users',
        updateUserRole: (userId) => `/api/v1/admin/users/${userId}/role`,
        banUser: (userId) => `/api/v1/admin/users/${userId}/ban`,
    },
    projects: {
        list: '/api/v1/projects',
        detail: (projectId) => `/api/v1/projects/${projectId}`,
    },
    comments: {
        list: (taskId) => `/api/v1/tasks/${taskId}/comments`,
        detail: (taskId, commentId) => `/api/v1/tasks/${taskId}/comments/${commentId}`,
    },
    labels: {
        list: '/api/v1/labels',
        detail: (labelId) => `/api/v1/labels/${labelId}`,
        taskLabels: (taskId) => `/api/v1/labels/task/${taskId}`,
    },
    documents: {
        list: '/api/v1/documents',
        detail: (docId) => `/api/v1/documents/${docId}`,
    },
    automations: {
        list: '/api/v1/automations',
        detail: (ruleId) => `/api/v1/automations/${ruleId}`,
    },
    templates: {
        list: '/api/v1/templates',
        detail: (templateId) => `/api/v1/templates/${templateId}`,
    },
};
