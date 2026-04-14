import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@entities/admin/admin.api';
import { EmptyState, PageSkeleton } from '@shared/components/ui';
import { ApiError } from '@shared/api/client';
import { toast } from '@app/store/toast.store';
const PLAN_OPTIONS = [
    'basic',
    'pro',
    'business',
    'enterprise',
];
export function AdminSubscriptionsPage() {
    const queryClient = useQueryClient();
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['admin', 'subscriptions', 1],
        queryFn: () => adminApi.listSubscriptions({ page: 1, limit: 50 }),
    });
    const [selectedPlans, setSelectedPlans] = React.useState({});
    const forcePlanMutation = useMutation({
        mutationFn: ({ tenantId, plan }) => adminApi.setTenantPlan(tenantId, plan),
        onSuccess: async () => {
            toast.success('Plan changed');
            await queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
            await queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
        },
        onError: (e) => {
            const msg = e instanceof ApiError ? e.message : 'Failed to force change plan';
            toast.error('Plan change failed', msg);
        },
    });
    if (isLoading)
        return _jsx(PageSkeleton, {});
    if (isError) {
        const msg = error instanceof ApiError ? error.message : 'Failed to load';
        return _jsx(EmptyState, { title: "Could not load subscriptions", description: msg });
    }
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 16 }, children: [_jsx("h1", { style: { fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }, children: "Subscriptions" }), _jsx("div", { style: { overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { background: 'var(--color-bg-muted)', textAlign: 'left' }, children: [_jsx("th", { style: { padding: 12 }, children: "Tenant" }), _jsx("th", { style: { padding: 12 }, children: "Status" }), _jsx("th", { style: { padding: 12 }, children: "Plan" }), _jsx("th", { style: { padding: 12 }, children: "Limits" }), _jsx("th", { style: { padding: 12 }, children: "Force change plan" })] }) }), _jsx("tbody", { children: data?.data.map((s) => (_jsxs("tr", { style: { borderTop: '1px solid var(--color-border)' }, children: [_jsx("td", { style: { padding: 12 }, children: s.tenant }), _jsx("td", { style: { padding: 12 }, children: s.status }), _jsx("td", { style: { padding: 12 }, children: s.plan ?? '—' }), _jsx("td", { style: { padding: 12 }, children: s.limits ? JSON.stringify(s.limits) : '—' }), _jsx("td", { style: { padding: 12 }, children: _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("select", { value: selectedPlans[s.tenant_id] ?? 'basic', onChange: (event) => setSelectedPlans((prev) => ({
                                                        ...prev,
                                                        [s.tenant_id]: event.target.value,
                                                    })), children: PLAN_OPTIONS.map((plan) => (_jsx("option", { value: plan, children: plan }, plan))) }), _jsx("button", { type: "button", disabled: forcePlanMutation.isPending, onClick: () => forcePlanMutation.mutate({
                                                        tenantId: s.tenant_id,
                                                        plan: selectedPlans[s.tenant_id] ?? 'basic',
                                                    }), children: "Force change" })] }) })] }, s.tenant_id))) })] }) }), _jsxs("p", { style: { color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }, children: ["Total: ", data?.pagination.total ?? 0] })] }));
}
