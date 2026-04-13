import React from 'react';
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
    mutationFn: (id: string) => adminApi.approvePayment(id),
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
    mutationFn: (id: string) => adminApi.rejectPayment(id),
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

  if (paymentsQuery.isLoading) return <PageSkeleton />;
  if (paymentsQuery.isError) {
    const msg = paymentsQuery.error instanceof ApiError ? paymentsQuery.error.message : 'Failed to load';
    return <EmptyState title="Could not load pending payments" description={msg} />;
  }

  const data = paymentsQuery.data?.data ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }}>Pending payments</h1>
      {data.length === 0 ? (
        <EmptyState title="No pending approvals" description="All payment requests are processed." />
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-muted)', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Tenant</th>
                <th style={{ padding: 12 }}>Requested plan</th>
                <th style={{ padding: 12 }}>Created</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const busy =
                  approveMutation.isPending && approveMutation.variables === item.id
                  || rejectMutation.isPending && rejectMutation.variables === item.id;
                return (
                  <tr key={item.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 12 }}>{item.tenant}</td>
                    <td style={{ padding: 12 }}>{item.plan}</td>
                    <td style={{ padding: 12 }}>{new Date(item.created_at).toLocaleString()}</td>
                    <td style={{ padding: 12 }}>{item.status}</td>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => approveMutation.mutate(item.id)}
                          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-success-border)', cursor: 'pointer' }}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => rejectMutation.mutate(item.id)}
                          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-danger-border)', cursor: 'pointer' }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
