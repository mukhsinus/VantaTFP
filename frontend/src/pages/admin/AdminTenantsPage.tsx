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

export function AdminTenantsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'tenants', 1],
    queryFn: () => adminApi.listTenants({ page: 1, limit: 50 }),
  });
  const [selectedTenantId, setSelectedTenantId] = React.useState<string | null>(null);
  const [selectedPlans, setSelectedPlans] = React.useState<Record<string, 'basic' | 'pro' | 'business' | 'enterprise'>>({});

  React.useEffect(() => {
    if (!selectedTenantId && data?.data?.length) {
      setSelectedTenantId(data.data[0].id);
    }
  }, [data, selectedTenantId]);

  const selectedTenant = data?.data.find((tenant) => tenant.id === selectedTenantId) ?? null;
  const tenantManagementQuery = useQuery({
    queryKey: ['admin', 'tenant', selectedTenantId],
    queryFn: () => adminApi.getTenantManagement(selectedTenantId!),
    enabled: Boolean(selectedTenantId),
  });
  const tenantStatsQuery = useQuery({
    queryKey: ['admin', 'monitoring', 'stats', selectedTenantId],
    queryFn: () => adminApi.getTenantStats(selectedTenantId!),
    enabled: Boolean(selectedTenantId),
  });
  const tenantAuditQuery = useQuery({
    queryKey: ['admin', 'audit-logs', selectedTenantId],
    queryFn: () => adminApi.getTenantAuditLogs(selectedTenantId!, { page: 1, limit: 5 }),
    enabled: Boolean(selectedTenantId),
  });

  const suspendMutation = useMutation({
    mutationFn: (tenantId: string) => adminApi.suspendTenant(tenantId),
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
    mutationFn: (tenantId: string) => adminApi.activateTenant(tenantId),
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
    mutationFn: ({ tenantId, plan }: { tenantId: string; plan: 'basic' | 'pro' | 'business' | 'enterprise' }) =>
      adminApi.setTenantPlan(tenantId, plan),
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
  const deactivateScopeMutation = useMutation({
    mutationFn: (tenantId: string) => adminApi.deactivateTenantManagement(tenantId),
    onSuccess: async () => {
      toast.info('Tenant deactivated');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'tenant'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'monitoring', 'stats'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
    onError: (e) => {
      const msg = e instanceof ApiError ? e.message : 'Deactivation failed';
      toast.error('Could not deactivate tenant', msg);
    },
  });

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    const msg = error instanceof ApiError ? error.message : 'Failed to load';
    return <EmptyState title="Could not load tenants" description={msg} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }}>Tenants</h1>
      <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg-muted)', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>Name</th>
              <th style={{ padding: 12 }}>Slug</th>
              <th style={{ padding: 12 }}>Plan</th>
              <th style={{ padding: 12 }}>Active</th>
              <th style={{ padding: 12 }}>Billing state</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((t) => (
              <tr
                key={t.id}
                style={{
                  borderTop: '1px solid var(--color-border)',
                  background: selectedTenantId === t.id ? 'var(--color-bg-muted)' : undefined,
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedTenantId(t.id)}
              >
                <td style={{ padding: 12 }}>{t.name}</td>
                <td style={{ padding: 12 }}>{t.slug}</td>
                <td style={{ padding: 12 }}>{t.plan}</td>
                <td style={{ padding: 12 }}>{t.is_active ? 'Yes' : 'No'}</td>
                <td style={{ padding: 12 }}>{t.billing_status ?? '—'}</td>
                <td style={{ padding: 12 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() =>
                        t.is_active ? suspendMutation.mutate(t.id) : activateMutation.mutate(t.id)
                      }
                    >
                      {t.is_active ? 'Suspend tenant' : 'Activate tenant'}
                    </button>
                    <select
                      value={selectedPlans[t.id] ?? 'basic'}
                      onChange={(event) =>
                        setSelectedPlans((prev) => ({
                          ...prev,
                          [t.id]: event.target.value as 'basic' | 'pro' | 'business' | 'enterprise',
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
                      onClick={() =>
                        planMutation.mutate({
                          tenantId: t.id,
                          plan: selectedPlans[t.id] ?? 'basic',
                        })
                      }
                    >
                      Change plan
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
      {selectedTenantId && (
        <section
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>
                Tenant scope: {tenantManagementQuery.data?.name ?? selectedTenant?.name ?? selectedTenantId}
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                {tenantManagementQuery.data?.slug ?? selectedTenant?.slug ?? '—'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => deactivateScopeMutation.mutate(selectedTenantId)}
              disabled={deactivateScopeMutation.isPending}
            >
              Deactivate workspace
            </button>
          </div>

          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 10 }}>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>Users</p>
              <p style={{ margin: '4px 0 0', fontWeight: 700 }}>
                {tenantStatsQuery.data?.stats.usersActive ?? tenantManagementQuery.data?.stats.usersActive ?? 0}
              </p>
            </div>
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 10 }}>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>Tasks open</p>
              <p style={{ margin: '4px 0 0', fontWeight: 700 }}>
                {tenantStatsQuery.data?.stats.tasksOpen ?? tenantManagementQuery.data?.stats.tasksOpen ?? 0}
              </p>
            </div>
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 10 }}>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>Tasks done</p>
              <p style={{ margin: '4px 0 0', fontWeight: 700 }}>
                {tenantStatsQuery.data?.stats.tasksDone ?? tenantManagementQuery.data?.stats.tasksDone ?? 0}
              </p>
            </div>
          </div>

          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-sm)' }}>Recent audit logs</h3>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(tenantAuditQuery.data?.data ?? []).length === 0 ? (
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                  No audit records for selected tenant.
                </p>
              ) : (
                tenantAuditQuery.data?.data.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      padding: 10,
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    <strong>{log.action}</strong> · {log.entity}
                    <div style={{ color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
