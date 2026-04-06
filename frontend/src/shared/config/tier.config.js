/**
 * Frontend Tier Configuration
 * Mirrors backend tier.config.ts for UI-level feature gating
 */
export var PlanType;
(function (PlanType) {
    PlanType["FREE"] = "FREE";
    PlanType["PRO"] = "PRO";
    PlanType["ENTERPRISE"] = "ENTERPRISE";
})(PlanType || (PlanType = {}));
export const TIER_CONFIG = {
    [PlanType.FREE]: {
        maxUsers: 5,
        maxTasks: 50,
        apiRateLimit: 100,
        tasksFeatures: {
            basicCrud: true,
            assignUsers: true,
            statusTracking: 'basic',
            timeTracking: false,
            auditHistory: false,
        },
        kpiModule: {
            basicMetrics: true,
            filters: false,
            perEmployee: false,
            analytics: false,
        },
        payroll: {
            viewOnly: true,
            fullCrud: false,
            kpiBasedCalculation: false,
            flexibleCalculation: false,
        },
        reports: {
            typesCovered: ['KPI', 'Payroll'],
            filterOptions: ['date'],
            csvExport: true,
            pdfExport: false,
            reportHistory: false,
        },
        rbac: {
            fixedRoles: true,
            customRoles: false,
            policyBased: false,
        },
        notifications: {
            inApp: true,
            advanced: false,
            telegram: false,
            email: false,
        },
        adminFeatures: {
            auditLogs: false,
            advancedTenantControl: false,
            dataExport: false,
        },
    },
    [PlanType.PRO]: {
        maxUsers: 1000,
        maxTasks: 100000,
        apiRateLimit: 1000,
        tasksFeatures: {
            basicCrud: true,
            assignUsers: true,
            statusTracking: 'advanced',
            timeTracking: true,
            auditHistory: true,
        },
        kpiModule: {
            basicMetrics: true,
            filters: true,
            perEmployee: true,
            analytics: true,
        },
        payroll: {
            viewOnly: false,
            fullCrud: true,
            kpiBasedCalculation: true,
            flexibleCalculation: true,
        },
        reports: {
            typesCovered: ['KPI', 'Payroll', 'Tasks'],
            filterOptions: ['date', 'user', 'team'],
            csvExport: true,
            pdfExport: true,
            reportHistory: true,
        },
        rbac: {
            fixedRoles: false,
            customRoles: true,
            policyBased: true,
        },
        notifications: {
            inApp: true,
            advanced: true,
            telegram: true,
            email: true,
        },
        adminFeatures: {
            auditLogs: true,
            advancedTenantControl: true,
            dataExport: true,
        },
    },
    [PlanType.ENTERPRISE]: {
        maxUsers: 10000,
        maxTasks: 1000000,
        apiRateLimit: 10000,
        tasksFeatures: {
            basicCrud: true,
            assignUsers: true,
            statusTracking: 'advanced',
            timeTracking: true,
            auditHistory: true,
        },
        kpiModule: {
            basicMetrics: true,
            filters: true,
            perEmployee: true,
            analytics: true,
        },
        payroll: {
            viewOnly: false,
            fullCrud: true,
            kpiBasedCalculation: true,
            flexibleCalculation: true,
        },
        reports: {
            typesCovered: ['KPI', 'Payroll', 'Tasks'],
            filterOptions: ['date', 'user', 'team', 'custom'],
            csvExport: true,
            pdfExport: true,
            reportHistory: true,
        },
        rbac: {
            fixedRoles: false,
            customRoles: true,
            policyBased: true,
        },
        notifications: {
            inApp: true,
            advanced: true,
            telegram: true,
            email: true,
        },
        adminFeatures: {
            auditLogs: true,
            advancedTenantControl: true,
            dataExport: true,
        },
    },
};
/**
 * Get feature config for a given plan
 */
export function getTierFeatures(plan) {
    if (!plan)
        return TIER_CONFIG[PlanType.FREE];
    return TIER_CONFIG[plan] ?? TIER_CONFIG[PlanType.FREE];
}
/**
 * Check if a feature is available in a given plan
 */
export function isFeatureAvailable(plan, featurePath) {
    const features = getTierFeatures(plan);
    const keys = featurePath.split('.');
    let current = features;
    for (const key of keys) {
        if (current?.[key] === undefined)
            return false;
        current = current[key];
    }
    return current === true;
}
