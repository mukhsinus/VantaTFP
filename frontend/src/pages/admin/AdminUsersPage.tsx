import React from 'react';
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
    mutationFn: ({ id, role }: { id: string; role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' }) =>
      adminApi.updateUserRole(id, role),
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
    mutationFn: (id: string) => adminApi.banUser(id),
    onSuccess: async () => {
      toast.info('User banned');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (e) => {
      const msg = e instanceof ApiError ? e.message : 'Ban failed';
      toast.error('Could not ban user', msg);
    },
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
              <th style={{ padding: 12 }}>Tenant role</th>
              <th style={{ padding: 12 }}>System role</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((u) => (
              <tr key={u.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td style={{ padding: 12 }}>{u.email}</td>
                <td style={{ padding: 12 }}>
                  {u.first_name} {u.last_name}
                </td>
                <td style={{ padding: 12 }}>{u.tenant_name ?? '—'}</td>
                <td style={{ padding: 12 }}>{u.tenant_role ?? u.role}</td>
                <td style={{ padding: 12 }}>{u.system_role}</td>
                <td style={{ padding: 12 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => updateRoleMutation.mutate({ id: u.id, role: 'ADMIN' })}
                      disabled={u.role === 'ADMIN'}
                    >
                      Promote to admin
                    </button>
                    <button
                      type="button"
                      onClick={() => updateRoleMutation.mutate({ id: u.id, role: 'EMPLOYEE' })}
                      disabled={u.role === 'EMPLOYEE'}
                    >
                      Demote
                    </button>
                    <button
                      type="button"
                      onClick={() => banMutation.mutate(u.id)}
                      disabled={!u.is_active}
                    >
                      Ban user
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
