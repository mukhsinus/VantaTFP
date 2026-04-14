import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@entities/admin/admin.api';
import { EmptyState, PageSkeleton } from '@shared/components/ui';
import { ApiError } from '@shared/api/client';
import { toast } from '@app/store/toast.store';
export function AdminUsersPage() {
    const queryClient = useQueryClient();
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['admin', 'users', 1],
        queryFn: () => adminApi.listUsers({ page: 1, limit: 50 }),
    });
    const updateRoleMutation = useMutation({
        mutationFn: ({ id, role }) => adminApi.updateUserRole(id, role),
        onSuccess: async () => {
            toast.success('User role updated');
            await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        },
        onError: (e) => {
            const msg = e instanceof ApiError ? e.message : 'Role update failed';
            toast.error('Could not update role', msg);
        },
    });
    const banMutation = useMutation({
        mutationFn: (id) => adminApi.banUser(id),
        onSuccess: async () => {
            toast.info('User banned');
            await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        },
        onError: (e) => {
            const msg = e instanceof ApiError ? e.message : 'Ban failed';
            toast.error('Could not ban user', msg);
        },
    });
    if (isLoading)
        return _jsx(PageSkeleton, {});
    if (isError) {
        const msg = error instanceof ApiError ? error.message : 'Failed to load';
        return _jsx(EmptyState, { title: "Could not load users", description: msg });
    }
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 16 }, children: [_jsx("h1", { style: { fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }, children: "Users" }), _jsx("div", { style: { overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { background: 'var(--color-bg-muted)', textAlign: 'left' }, children: [_jsx("th", { style: { padding: 12 }, children: "Email" }), _jsx("th", { style: { padding: 12 }, children: "Name" }), _jsx("th", { style: { padding: 12 }, children: "Tenant" }), _jsx("th", { style: { padding: 12 }, children: "Tenant role" }), _jsx("th", { style: { padding: 12 }, children: "System role" }), _jsx("th", { style: { padding: 12 }, children: "Actions" })] }) }), _jsx("tbody", { children: data?.data.map((u) => (_jsxs("tr", { style: { borderTop: '1px solid var(--color-border)' }, children: [_jsx("td", { style: { padding: 12 }, children: u.email }), _jsxs("td", { style: { padding: 12 }, children: [u.first_name, " ", u.last_name] }), _jsx("td", { style: { padding: 12 }, children: u.tenant_name ?? '—' }), _jsx("td", { style: { padding: 12 }, children: u.tenant_role ?? u.role }), _jsx("td", { style: { padding: 12 }, children: u.system_role }), _jsx("td", { style: { padding: 12 }, children: _jsxs("div", { style: { display: 'flex', gap: 8, flexWrap: 'wrap' }, children: [_jsx("button", { type: "button", onClick: () => updateRoleMutation.mutate({ id: u.id, role: 'ADMIN' }), disabled: u.role === 'ADMIN', children: "Promote to admin" }), _jsx("button", { type: "button", onClick: () => updateRoleMutation.mutate({ id: u.id, role: 'EMPLOYEE' }), disabled: u.role === 'EMPLOYEE', children: "Demote" }), _jsx("button", { type: "button", onClick: () => banMutation.mutate(u.id), disabled: !u.is_active, children: "Ban user" })] }) })] }, u.id))) })] }) }), _jsxs("p", { style: { color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }, children: ["Total: ", data?.pagination.total ?? 0] })] }));
}
