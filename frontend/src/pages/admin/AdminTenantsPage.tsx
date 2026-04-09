import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformApi } from '@entities/platform/platform.api';
import { EmptyState, PageSkeleton } from '@shared/components/ui';
import { ApiError } from '@shared/api/client';

export function AdminTenantsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['platform', 'tenants', 1],
    queryFn: () => platformApi.listTenants(1, 50),
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
            </tr>
          </thead>
          <tbody>
            {data?.data.map((t) => (
              <tr key={t.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td style={{ padding: 12 }}>{t.name}</td>
                <td style={{ padding: 12 }}>{t.slug}</td>
                <td style={{ padding: 12 }}>{t.plan}</td>
                <td style={{ padding: 12 }}>{t.isActive ? 'Yes' : 'No'}</td>
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
