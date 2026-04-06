import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Example implementations showing how to use tier gating in components
 * These demonstrate patterns for the Payroll, KPI, and Tasks modules
 */
// ============================================================================
// EXAMPLE 1: Payroll Module - Conditional CRUD based on tier
// ============================================================================
import React from 'react';
import { usePayrollAccess } from '../hooks/useUserTier';
import { UpgradeBanner, UpgradeFeatureGuard } from '../components/UpgradeBanner';
export function PayrollListExample() {
    const { canEdit, isReadOnly, plan, message } = usePayrollAccess();
    return (_jsxs("div", { children: [_jsx("h1", { children: "Payroll Management" }), isReadOnly && (_jsx(UpgradeBanner, { featureName: "Payroll Editing", currentPlan: plan ?? 'free', onUpgradeClick: () => window.location.href = '/upgrade', dismissible: true })), _jsx("div", { className: "payroll-list" }), canEdit && (_jsx("button", { className: "btn--primary", children: "Create New Payroll Entry" })), !canEdit && (_jsx("button", { className: "btn--primary", disabled: true, title: message, children: "Create New Payroll Entry (Upgrade Required)" }))] }));
}
// ============================================================================
// EXAMPLE 2: KPI Module - Analytics locked behind tier
// ============================================================================
import { useKpiAccess } from '../hooks/useUserTier';
export function KpiAnalyticsExample() {
    const { canViewAnalytics, plan, messages } = useKpiAccess();
    return (_jsxs("div", { className: "kpi-container", children: [_jsx("h2", { children: "KPI Analytics & Reports" }), _jsx(UpgradeFeatureGuard, { available: canViewAnalytics, featureName: `KPI Analytics Dashboard`, currentPlan: plan ?? 'free', fallback: _jsxs("div", { className: "placeholder-content", children: [_jsx("p", { children: "Analytics and detailed reporting are available in PRO and ENTERPRISE plans." }), _jsx("button", { onClick: () => window.location.href = '/upgrade', children: "Upgrade to view KPI Analytics" })] }), children: _jsx("div", { className: "analytics-dashboard", children: _jsx("canvas", { id: "kpi-chart" }) }) })] }));
}
// ============================================================================
// EXAMPLE 3: Tasks Module - Time tracking feature with guard
// ============================================================================
import { useTasksAccess } from '../hooks/useUserTier';
export function TaskTimeTrackingExample() {
    const { canTrackTime, plan, messages } = useTasksAccess();
    return (_jsxs("div", { className: "task-time-tracking", children: [_jsx("h3", { children: "Time Tracking" }), !canTrackTime && (_jsx(UpgradeBanner, { featureName: "Time Tracking", currentPlan: plan ?? 'free', variant: "inline", dismissible: true })), canTrackTime ? (_jsxs("div", { className: "time-tracker", children: [_jsx("input", { type: "time", placeholder: "Start time" }), _jsx("input", { type: "time", placeholder: "End time" }), _jsx("button", { children: "Log Time" })] })) : (_jsxs("div", { style: { opacity: 0.5, pointerEvents: 'none' }, children: [_jsx("input", { type: "time", placeholder: "Start time", disabled: true }), _jsx("input", { type: "time", placeholder: "End time", disabled: true }), _jsx("button", { disabled: true, children: "Log Time" })] }))] }));
}
// ============================================================================
// EXAMPLE 4: Reports Module - Export options based on tier
// ============================================================================
import { getTierFeatures } from '../config/tier.config';
import { useUserTier } from '../hooks/useUserTier';
import { UpgradeLockIcon } from '../components/UpgradeBanner';
export function ReportExportExample() {
    const { plan } = useUserTier();
    const features = getTierFeatures(plan);
    return (_jsxs("div", { className: "report-export-options", children: [_jsx("h3", { children: "Export Report" }), _jsxs("div", { className: "export-buttons", children: [features.reports.csvExport && (_jsx("button", { className: "btn--export", children: "\uD83D\uDCE5 Export as CSV" })), features.reports.pdfExport ? (_jsx("button", { className: "btn--export", children: "\uD83D\uDCC4 Export as PDF" })) : (_jsxs("button", { className: "btn--export", disabled: true, title: "PDF export requires PRO plan", children: ["\uD83D\uDCC4 Export as PDF", _jsx(UpgradeLockIcon, {})] }))] }), !features.reports.pdfExport && (_jsx("p", { className: "note", children: "PDF export is available in PRO and ENTERPRISE plans." }))] }));
}
// ============================================================================
// EXAMPLE 5: User Management - Enforce user limits
// ============================================================================
import { useUserLimits } from '../hooks/useUserTier';
export function UserManagementExample() {
    const { maxUsers, isFreeTier, plan } = useUserLimits();
    const [userCount, setUserCount] = React.useState(3);
    const canAddMore = userCount < maxUsers;
    return (_jsxs("div", { className: "user-management", children: [_jsx("h2", { children: "Team Members" }), _jsxs("div", { className: "user-count-display", children: ["You have ", _jsx("strong", { children: userCount }), " / ", _jsx("strong", { children: maxUsers }), " team members", isFreeTier && _jsx("span", { className: "free-tier-badge", children: "Free Tier" })] }), canAddMore ? (_jsx("button", { className: "btn--primary", children: "+ Add Team Member" })) : (_jsxs("div", { className: "at-limit-message", children: [_jsxs("p", { children: ["You've reached the user limit for your ", plan, " plan."] }), _jsx("button", { onClick: () => window.location.href = '/upgrade', children: "Upgrade to add more users" })] })), _jsx("div", { className: "user-list" })] }));
}
// ============================================================================
// EXAMPLE 6: Navigation - Hide/show menu items based on tier
// ============================================================================
import { useFeatureAccess } from '../hooks/useUserTier';
export function NavMenuExample() {
    const payrollAccess = useFeatureAccess('payroll.fullCrud');
    const kpiAnalytics = useFeatureAccess('kpiModule.analytics');
    const customRbac = useFeatureAccess('rbac.customRoles');
    return (_jsx("nav", { className: "sidebar", children: _jsxs("ul", { children: [_jsx("li", { children: _jsx("a", { href: "/dashboard", children: "Dashboard" }) }), _jsx("li", { children: _jsx("a", { href: "/tasks", children: "Tasks" }) }), _jsx("li", { children: _jsx("a", { href: "/users", children: "Team" }) }), payrollAccess.available && (_jsx("li", { children: _jsx("a", { href: "/payroll", children: "Payroll" }) })), _jsx("li", { children: _jsxs("a", { href: "/kpi", children: ["KPI", kpiAnalytics.upgradeRequired && _jsx("span", { className: "pro-badge", children: "Pro" })] }) }), customRbac.available && (_jsx("li", { children: _jsx("a", { href: "/roles", children: "Custom Roles" }) }))] }) }));
}
