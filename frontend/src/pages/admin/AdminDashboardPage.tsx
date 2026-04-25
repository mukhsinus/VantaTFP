import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@entities/admin/admin.api';
import { ApiError } from '@shared/api/client';
import { EmptyState, PageSkeleton } from '@shared/components/ui';
import { useAdminScopeStore } from '@app/store/admin-scope.store';

const card: React.CSSProperties = {
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
  const selectedTenantId = useAdminScopeStore((s) => s.selectedTenantId);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'dashboard', selectedTenantId],
    queryFn: () => adminApi.getDashboard({ tenantId: selectedTenantId ?? undefined }),
  });
  const healthQuery = useQuery({
    queryKey: ['admin', 'monitoring', 'health'],
    queryFn: () => adminApi.getSystemHealth(),
  });
  const tenantStatsQuery = useQuery({
    queryKey: ['admin', 'monitoring', 'stats', selectedTenantId],
    queryFn: () => adminApi.getTenantStats(selectedTenantId!),
    enabled: Boolean(selectedTenantId),
  });

  if (isLoading) return <PageSkeleton />;
  if (isError) {
    const msg = error instanceof ApiError ? error.message : 'Failed to load';
    return <EmptyState title="Could not load system dashboard" description={msg} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0 }}>Admin dashboard</h1>
        <p style={{ margin: '6px 0 0', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          Current tenant scope: {selectedTenantId ?? 'not selected'}
        </p>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 14,
        }}
      >
        <div style={card}>
          Total tenants: {data?.totalTenants ?? 0}
        </div>
        <div style={card}>
          Active subscriptions: {data?.activeSubscriptions ?? 0}
        </div>
        <div style={card}>
          Pending payments: {data?.pendingPayments ?? 0}
        </div>
        <div style={card}>
          MRR: ${data?.mrr ?? 0}
        </div>
        <div style={card}>
          DB health:{' '}
          {healthQuery.data?.db === 'up'
            ? 'up'
            : healthQuery.isError
              ? 'unavailable'
              : 'checking...'}
        </div>
        <div style={card}>
          Scoped users active:{' '}
          {tenantStatsQuery.isLoading
            ? '...'
            : tenantStatsQuery.data?.stats.usersActive ?? 0}
        </div>
        <div style={card}>
          Scoped tasks open:{' '}
          {tenantStatsQuery.isLoading
            ? '...'
            : tenantStatsQuery.data?.stats.tasksOpen ?? 0}
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 14,
        }}
      >
        <Link to="/admin/payments" style={card}>
          View pending payments
        </Link>
        <Link to="/admin/users" style={card}>
          View users
        </Link>
        <Link to="/admin/tenants" style={card}>
          View tenants
        </Link>
      </div>
    </div>
  );
}
