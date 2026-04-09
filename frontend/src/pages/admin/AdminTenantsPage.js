import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { platformApi } from '@entities/platform/platform.api';
import { EmptyState, PageSkeleton } from '@shared/components/ui';
import { ApiError } from '@shared/api/client';
export function AdminTenantsPage() {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['platform', 'tenants', 1],
        queryFn: () => platformApi.listTenants(1, 50),
    });
    if (isLoading)
        return _jsx(PageSkeleton, {});
    if (isError) {
        const msg = error instanceof ApiError ? error.message : 'Failed to load';
        return _jsx(EmptyState, { title: "Could not load tenants", description: msg });
    }
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 16 }, children: [_jsx("h1", { style: { fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }, children: "Tenants" }), _jsx("div", { style: { overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { background: 'var(--color-bg-muted)', textAlign: 'left' }, children: [_jsx("th", { style: { padding: 12 }, children: "Name" }), _jsx("th", { style: { padding: 12 }, children: "Slug" }), _jsx("th", { style: { padding: 12 }, children: "Plan" }), _jsx("th", { style: { padding: 12 }, children: "Active" })] }) }), _jsx("tbody", { children: data?.data.map((t) => (_jsxs("tr", { style: { borderTop: '1px solid var(--color-border)' }, children: [_jsx("td", { style: { padding: 12 }, children: t.name }), _jsx("td", { style: { padding: 12 }, children: t.slug }), _jsx("td", { style: { padding: 12 }, children: t.plan }), _jsx("td", { style: { padding: 12 }, children: t.isActive ? 'Yes' : 'No' })] }, t.id))) })] }) }), _jsxs("p", { style: { color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }, children: ["Total: ", data?.pagination.total ?? 0] })] }));
}
