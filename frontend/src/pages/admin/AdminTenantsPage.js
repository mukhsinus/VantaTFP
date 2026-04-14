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
export function AdminTenantsPage() {
    const queryClient = useQueryClient();
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['admin', 'tenants', 1],
        queryFn: () => adminApi.listTenants({ page: 1, limit: 50 }),
    });
    const [selectedPlans, setSelectedPlans] = React.useState({});
    const suspendMutation = useMutation({
        mutationFn: (tenantId) => adminApi.suspendTenant(tenantId),
        onSuccess: async () => {
            toast.info('Tenant suspended');
            await queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
        },
        onError: (e) => {
            const msg = e instanceof ApiError ? e.message : 'Suspend failed';
            toast.error('Could not suspend tenant', msg);
        },
    });
    const activateMutation = useMutation({
        mutationFn: (tenantId) => adminApi.activateTenant(tenantId),
        onSuccess: async () => {
            toast.success('Tenant activated');
            await queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
        },
        onError: (e) => {
            const msg = e instanceof ApiError ? e.message : 'Activation failed';
            toast.error('Could not activate tenant', msg);
        },
    });
    const planMutation = useMutation({
        mutationFn: ({ tenantId, plan }) => adminApi.setTenantPlan(tenantId, plan),
        onSuccess: async () => {
            toast.success('Plan changed');
            await queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
            await queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
        },
        onError: (e) => {
            const msg = e instanceof ApiError ? e.message : 'Plan change failed';
            toast.error('Could not change tenant plan', msg);
        },
    });
    if (isLoading)
        return _jsx(PageSkeleton, {});
    if (isError) {
        const msg = error instanceof ApiError ? error.message : 'Failed to load';
        return _jsx(EmptyState, { title: "Could not load tenants", description: msg });
    }
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 16 }, children: [_jsx("h1", { style: { fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }, children: "Tenants" }), _jsx("div", { style: { overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { background: 'var(--color-bg-muted)', textAlign: 'left' }, children: [_jsx("th", { style: { padding: 12 }, children: "Name" }), _jsx("th", { style: { padding: 12 }, children: "Slug" }), _jsx("th", { style: { padding: 12 }, children: "Plan" }), _jsx("th", { style: { padding: 12 }, children: "Active" }), _jsx("th", { style: { padding: 12 }, children: "Billing state" }), _jsx("th", { style: { padding: 12 }, children: "Actions" })] }) }), _jsx("tbody", { children: data?.data.map((t) => (_jsxs("tr", { style: { borderTop: '1px solid var(--color-border)' }, children: [_jsx("td", { style: { padding: 12 }, children: t.name }), _jsx("td", { style: { padding: 12 }, children: t.slug }), _jsx("td", { style: { padding: 12 }, children: t.plan }), _jsx("td", { style: { padding: 12 }, children: t.is_active ? 'Yes' : 'No' }), _jsx("td", { style: { padding: 12 }, children: t.billing_status ?? '—' }), _jsx("td", { style: { padding: 12 }, children: _jsxs("div", { style: { display: 'flex', gap: 8, flexWrap: 'wrap' }, children: [_jsx("button", { type: "button", onClick: () => t.is_active ? suspendMutation.mutate(t.id) : activateMutation.mutate(t.id), children: t.is_active ? 'Suspend tenant' : 'Activate tenant' }), _jsx("select", { value: selectedPlans[t.id] ?? 'basic', onChange: (event) => setSelectedPlans((prev) => ({
                                                        ...prev,
                                                        [t.id]: event.target.value,
                                                    })), children: PLAN_OPTIONS.map((plan) => (_jsx("option", { value: plan, children: plan }, plan))) }), _jsx("button", { type: "button", onClick: () => planMutation.mutate({
                                                        tenantId: t.id,
                                                        plan: selectedPlans[t.id] ?? 'basic',
                                                    }), children: "Change plan" })] }) })] }, t.id))) })] }) }), _jsxs("p", { style: { color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }, children: ["Total: ", data?.pagination.total ?? 0] })] }));
}
