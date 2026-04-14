import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@entities/admin/admin.api';
import { ApiError } from '@shared/api/client';
import { EmptyState, PageSkeleton } from '@shared/components/ui';
const card = {
    display: 'block',
    padding: 20,
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    textDecoration: 'none',
    color: 'var(--color-text-primary)',
    fontWeight: 600,
    boxShadow: 'var(--shadow-xs)',
};
export function AdminDashboardPage() {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['admin', 'dashboard'],
        queryFn: () => adminApi.getDashboard(),
    });
    if (isLoading)
        return _jsx(PageSkeleton, {});
    if (isError) {
        const msg = error instanceof ApiError ? error.message : 'Failed to load';
        return _jsx(EmptyState, { title: "Could not load system dashboard", description: msg });
    }
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 20 }, children: [_jsx("div", { children: _jsx("h1", { style: { fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0 }, children: "Admin dashboard" }) }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 14,
                }, children: [_jsxs("div", { style: card, children: ["Total tenants: ", data?.totalTenants ?? 0] }), _jsxs("div", { style: card, children: ["Active subscriptions: ", data?.activeSubscriptions ?? 0] }), _jsxs("div", { style: card, children: ["Pending payments: ", data?.pendingPayments ?? 0] }), _jsxs("div", { style: card, children: ["MRR: $", data?.mrr ?? 0] })] }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 14,
                }, children: [_jsx(Link, { to: "/admin/payments", style: card, children: "View pending payments" }), _jsx(Link, { to: "/admin/users", style: card, children: "View users" }), _jsx(Link, { to: "/admin/tenants", style: card, children: "View tenants" })] })] }));
}
