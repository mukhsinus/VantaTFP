import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Card, EmptyState, PageSkeleton } from '@shared/components/ui';
import { useBillingSnapshot } from '@features/billing/hooks/useBilling';
import { BillingLimitsGrid } from '@features/billing/components/BillingLimitsGrid';
export function BillingPage() {
    const { data, isLoading, isError } = useBillingSnapshot();
    if (isLoading) {
        return _jsx(PageSkeleton, {});
    }
    if (isError || !data) {
        return (_jsx(EmptyState, { title: "Billing unavailable", description: "Could not load billing info." }));
    }
    return (_jsxs("div", { className: "page-container", style: { display: 'flex', flexDirection: 'column', gap: 16 }, children: [_jsxs("div", { children: [_jsx("h2", { style: { margin: 0 }, children: "Billing" }), _jsx("p", { style: { margin: '6px 0 0', color: 'var(--color-text-secondary)' }, children: "Current plan and limits for your tenant." })] }), _jsx(Card, { children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, children: [_jsxs("div", { children: [_jsx("p", { style: { margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }, children: "Tenant" }), _jsx("p", { style: { margin: '4px 0 0', fontWeight: 700 }, children: data.tenantId })] }), _jsx(Badge, { variant: "accent", children: data.planName })] }) }), _jsx(BillingLimitsGrid, { limits: data.limits }), _jsxs(Card, { children: [_jsx("p", { style: { margin: 0, fontWeight: 600 }, children: "Current Usage" }), _jsxs("p", { style: { margin: '8px 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }, children: ["Users: ", data.usage.users, " \u00B7 Tasks: ", data.usage.tasks, " \u00B7 API/hour: ", data.usage.apiRatePerHour] })] })] }));
}
