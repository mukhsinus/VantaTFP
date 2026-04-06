/**
 * useUserTier - Hook to access user's tier information and check feature access
 */
import { useEffect, useState } from 'react';
import { getTierFeatures, isFeatureAvailable, PlanType } from '../config/tier.config';
export function useUserTier() {
    const [tierInfo, setTierInfo] = useState({
        plan: PlanType.FREE,
        maxUsers: 5,
        maxTasks: 50,
        apiRateLimit: 100,
    });
    useEffect(() => {
        // Get plan from localStorage or session storage after login
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                const plan = user.tenantPlan || PlanType.FREE;
                const features = getTierFeatures(plan);
                setTierInfo({
                    plan,
                    maxUsers: features.maxUsers,
                    maxTasks: features.maxTasks,
                    apiRateLimit: features.apiRateLimit,
                });
            }
            catch (e) {
                // Fallback to FREE tier
                console.error('Failed to parse user info', e);
            }
        }
    }, []);
    return tierInfo;
}
/**
 * useFeatureAccess - Hook to check if a specific feature is available
 * @param featurePath - Dot-notation path to feature (e.g., 'payroll.fullCrud', 'kpiModule.analytics')
 * @returns object with available flag and upgrade message
 */
export function useFeatureAccess(featurePath) {
    const { plan } = useUserTier();
    const available = isFeatureAvailable(plan, featurePath);
    return {
        available,
        plan,
        upgradeRequired: !available,
        message: !available
            ? `This feature is only available in PRO and ENTERPRISE plans. Please upgrade from your current ${plan} plan.`
            : undefined,
    };
}
/**
 * Hook to check payroll access
 */
export function usePayrollAccess() {
    const { plan } = useUserTier();
    const features = getTierFeatures(plan);
    return {
        canView: true, // All tiers can view
        canEdit: features.payroll.fullCrud,
        isReadOnly: features.payroll.viewOnly,
        plan,
        message: !features.payroll.fullCrud
            ? 'Payroll management is available in PRO and ENTERPRISE plans only.'
            : undefined,
    };
}
/**
 * Hook to check KPI feature access
 */
export function useKpiAccess() {
    const { plan } = useUserTier();
    const features = getTierFeatures(plan);
    return {
        canCreatePerEmployee: features.kpiModule.perEmployee,
        canUseFilters: features.kpiModule.filters,
        canViewAnalytics: features.kpiModule.analytics,
        plan,
        messages: {
            analytics: !features.kpiModule.analytics
                ? 'Analytics are available in PRO and ENTERPRISE plans only.'
                : undefined,
            perEmployee: !features.kpiModule.perEmployee
                ? 'Per-employee KPI tracking is available in PRO and ENTERPRISE plans only.'
                : undefined,
        },
    };
}
/**
 * Hook to check task feature access
 */
export function useTasksAccess() {
    const { plan } = useUserTier();
    const features = getTierFeatures(plan);
    return {
        canTrackTime: features.tasksFeatures.timeTracking,
        hasAdvancedStatus: features.tasksFeatures.statusTracking === 'advanced',
        canViewHistory: features.tasksFeatures.auditHistory,
        plan,
        messages: {
            timeTracking: !features.tasksFeatures.timeTracking
                ? 'Time tracking is available in PRO and ENTERPRISE plans only.'
                : undefined,
            history: !features.tasksFeatures.auditHistory
                ? 'Task history is available in PRO and ENTERPRISE plans only.'
                : undefined,
        },
    };
}
/**
 * Hook to check user limits
 */
export function useUserLimits() {
    const { plan, maxUsers, maxTasks } = useUserTier();
    return {
        plan,
        maxUsers,
        maxTasks,
        isFreeTier: plan === PlanType.FREE,
    };
}
