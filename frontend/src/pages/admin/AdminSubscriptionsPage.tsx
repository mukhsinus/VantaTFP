import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@entities/admin/admin.api';
import { EmptyState, PageSkeleton } from '@shared/components/ui';
import { ApiError } from '@shared/api/client';
import { toast } from '@app/store/toast.store';

const PLAN_OPTIONS: Array<'basic' | 'pro' | 'business' | 'enterprise'> = [
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

  const [selectedPlans, setSelectedPlans] = React.useState<Record<string, 'basic' | 'pro' | 'business' | 'enterprise'>>({});

  const forcePlanMutation = useMutation({
    mutationFn: ({ tenantId, plan }: { tenantId: string; plan: 'basic' | 'pro' | 'business' | 'enterprise' }) =>
      adminApi.setTenantPlan(tenantId, plan),
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

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    const msg = error instanceof ApiError ? error.message : 'Failed to load';
    return <EmptyState title="Could not load subscriptions" description={msg} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }}>Subscriptions</h1>
      <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg-muted)', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>Tenant</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Plan</th>
              <th style={{ padding: 12 }}>Limits</th>
              <th style={{ padding: 12 }}>Force change plan</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((s) => (
              <tr key={s.tenant_id} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td style={{ padding: 12 }}>{s.tenant}</td>
                <td style={{ padding: 12 }}>{s.status}</td>
                <td style={{ padding: 12 }}>{s.plan ?? '—'}</td>
                <td style={{ padding: 12 }}>{s.limits ? JSON.stringify(s.limits) : '—'}</td>
                <td style={{ padding: 12 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      value={selectedPlans[s.tenant_id] ?? 'basic'}
                      onChange={(event) =>
                        setSelectedPlans((prev) => ({
                          ...prev,
                          [s.tenant_id]: event.target.value as 'basic' | 'pro' | 'business' | 'enterprise',
                        }))
                      }
                    >
                      {PLAN_OPTIONS.map((plan) => (
                        <option key={plan} value={plan}>
                          {plan}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={forcePlanMutation.isPending}
                      onClick={() =>
                        forcePlanMutation.mutate({
                          tenantId: s.tenant_id,
                          plan: selectedPlans[s.tenant_id] ?? 'basic',
                        })
                      }
                    >
                      Force change
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
        Total: {data?.pagination.total ?? 0}
      </p>
    </div>
  );
}
