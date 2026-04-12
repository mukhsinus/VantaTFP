import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformApi } from '@entities/platform/platform.api';
import { EmptyState, PageSkeleton } from '@shared/components/ui';
import { ApiError } from '@shared/api/client';

export function AdminUsersPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['platform', 'users', 1],
    queryFn: () => platformApi.listUsers(1, 50),
  });

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    const msg = error instanceof ApiError ? error.message : 'Failed to load';
    return <EmptyState title="Could not load users" description={msg} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }}>Users</h1>
      <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg-muted)', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>Email</th>
              <th style={{ padding: 12 }}>Name</th>
              <th style={{ padding: 12 }}>Tenant</th>
              <th style={{ padding: 12 }}>Role</th>
              <th style={{ padding: 12 }}>System</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((u) => (
              <tr key={u.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td style={{ padding: 12 }}>{u.email}</td>
                <td style={{ padding: 12 }}>
                  {u.firstName} {u.lastName}
                </td>
                <td style={{ padding: 12 }}>{u.tenantName ?? '—'}</td>
                <td style={{ padding: 12 }}>{u.role}</td>
                <td style={{ padding: 12 }}>{u.systemRole}</td>
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
