import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@entities/admin/admin.api';
import { ApiError } from '@shared/api/client';
import { EmptyState, PageSkeleton } from '@shared/components/ui';

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
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.getDashboard(),
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
