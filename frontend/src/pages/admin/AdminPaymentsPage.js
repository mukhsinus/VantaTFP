import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@entities/admin/admin.api';
import { EmptyState, PageSkeleton } from '@shared/components/ui';
import { ApiError } from '@shared/api/client';
import { toast } from '@app/store/toast.store';
export function AdminPaymentsPage() {
    const queryClient = useQueryClient();
    const paymentsQuery = useQuery({
        queryKey: ['admin', 'payments', 'pending'],
        queryFn: () => adminApi.listPayments({ status: 'pending', page: 1, limit: 100 }),
    });
    const approveMutation = useMutation({
        mutationFn: (id) => adminApi.approvePayment(id),
        onSuccess: async () => {
            toast.success('Payment approved', 'Tenant plan is activated.');
            await queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
            await queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
            await queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
        },
        onError: (error) => {
            const message = error instanceof ApiError ? error.message : 'Approval failed';
            toast.error('Could not approve payment', message);
        },
    });
    const rejectMutation = useMutation({
        mutationFn: (id) => adminApi.rejectPayment(id),
        onSuccess: async () => {
            toast.info('Payment rejected');
            await queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
            await queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
        },
        onError: (error) => {
            const message = error instanceof ApiError ? error.message : 'Reject failed';
            toast.error('Could not reject payment', message);
        },
    });
    if (paymentsQuery.isLoading)
        return _jsx(PageSkeleton, {});
    if (paymentsQuery.isError) {
        const msg = paymentsQuery.error instanceof ApiError ? paymentsQuery.error.message : 'Failed to load';
        return _jsx(EmptyState, { title: "Could not load pending payments", description: msg });
    }
    const data = paymentsQuery.data?.data ?? [];
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 16 }, children: [_jsx("h1", { style: { fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }, children: "Pending payments" }), data.length === 0 ? (_jsx(EmptyState, { title: "No pending approvals", description: "All payment requests are processed." })) : (_jsx("div", { style: { overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { background: 'var(--color-bg-muted)', textAlign: 'left' }, children: [_jsx("th", { style: { padding: 12 }, children: "Tenant" }), _jsx("th", { style: { padding: 12 }, children: "Requested plan" }), _jsx("th", { style: { padding: 12 }, children: "Created" }), _jsx("th", { style: { padding: 12 }, children: "Status" }), _jsx("th", { style: { padding: 12 }, children: "Action" })] }) }), _jsx("tbody", { children: data.map((item) => {
                                const busy = approveMutation.isPending && approveMutation.variables === item.id
                                    || rejectMutation.isPending && rejectMutation.variables === item.id;
                                return (_jsxs("tr", { style: { borderTop: '1px solid var(--color-border)' }, children: [_jsx("td", { style: { padding: 12 }, children: item.tenant }), _jsx("td", { style: { padding: 12 }, children: item.plan }), _jsx("td", { style: { padding: 12 }, children: new Date(item.created_at).toLocaleString() }), _jsx("td", { style: { padding: 12 }, children: item.status }), _jsx("td", { style: { padding: 12 }, children: _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { type: "button", disabled: busy, onClick: () => approveMutation.mutate(item.id), style: { padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-success-border)', cursor: 'pointer' }, children: "Approve" }), _jsx("button", { type: "button", disabled: busy, onClick: () => rejectMutation.mutate(item.id), style: { padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-danger-border)', cursor: 'pointer' }, children: "Reject" })] }) })] }, item.id));
                            }) })] }) }))] }));
}
