import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Avatar, Input, EmptyState, PageSkeleton, Select } from '@shared/components/ui';
import { useUsers } from '@features/users/hooks/useUsers';
import { useUpdateUser } from '@features/users/hooks/useUpdateUser';
import { useDeleteUser } from '@features/users/hooks/useDeleteUser';
import { CreateUserModal } from '@features/users/components/CreateUserModal';
import { usePermissions } from '@shared/hooks/useCanPerform';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import type { Role } from '@shared/types/auth.types';
import type { UserUiModel } from '@entities/user/users.types';

const roleVariant: Record<Role, 'danger' | 'warning' | 'success'> = {
  ADMIN: 'danger',
  MANAGER: 'warning',
  EMPLOYEE: 'success',
};

export function EmployeesPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { users, isLoading, isError } = useUsers();
  const { can } = usePermissions();
  const { role: currentRole, user: currentUser } = useCurrentUser();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = useMemo(() => {
    return users.filter((e) => {
      const matchSearch = `${e.fullName} ${e.email}`.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'ALL' || e.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    return (
      <EmptyState
        title={t('errors.loadFailed.title')}
        description={t('errors.loadFailed.description')}
        action={{ label: t('common.actions.retry'), onClick: () => window.location.reload() }}
      />
    );
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 10 : 0 }}>
          <div>
            <h2 style={{ fontSize: isMobile ? 'var(--text-xl)' : 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {t('employees.title')}
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
              {users.length} {t('employees.total')}
            </p>
          </div>

          {can('employee:invite') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              leftIcon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 5v14M5 12h14" />
                </svg>
              }
            >
              {t('employees.invite')}
            </Button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ flex: 1, maxWidth: isMobile ? '100%' : 300, width: '100%' }}>
            <Input
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
              }
            />
          </div>
          <div style={{ display: 'flex', gap: 6, width: isMobile ? '100%' : undefined, overflowX: isMobile ? 'auto' : undefined }}>
            {(['ALL', 'ADMIN', 'MANAGER', 'EMPLOYEE'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                style={{
                  padding: '5px 12px',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                  background: roleFilter === r ? 'var(--color-accent)' : 'var(--color-bg)',
                  color: roleFilter === r ? '#fff' : 'var(--color-text-secondary)',
                  borderColor: roleFilter === r ? 'var(--color-accent)' : 'var(--color-border-strong)',
                }}
              >
                {r === 'ALL'
                  ? t('profile.roles.all')
                  : r === 'ADMIN'
                    ? t('profile.roles.admin')
                    : r === 'MANAGER'
                      ? t('profile.roles.manager')
                      : t('profile.roles.employee')}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={t('employees.empty.title')}
            description={t('employees.empty.description')}
            action={can('employee:invite') ? { label: t('employees.invite'), onClick: () => setShowCreateModal(true) } : undefined}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: isMobile ? 10 : 16,
            }}
          >
            {filtered.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                currentRole={currentRole}
                currentUserId={currentUser?.userId ?? null}
              />
            ))}
          </div>
        )}
      </div>

      {currentRole && (
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          creatorRole={currentRole}
        />
      )}
    </>
  );
}

function EmployeeCard({
  employee,
  currentRole,
  currentUserId,
}: {
  employee: UserUiModel;
  currentRole: Role | null;
  currentUserId: string | null;
}) {
  const { t } = useTranslation();
  const { updateUser, isPending: isUpdating } = useUpdateUser();
  const { deleteUser, isPending: isDeleting } = useDeleteUser();
  const { can } = usePermissions();
  const [roleDraft, setRoleDraft] = useState<Role>(employee.role);

  const isSelf = currentUserId === employee.id;
  const canManage = can('employee:manage') && !isSelf;
  const managerCannotManageTarget =
    currentRole === 'MANAGER' && employee.role !== 'EMPLOYEE';
  const canEditThisUser = canManage && !managerCannotManageTarget;

  const availableRoleOptions = currentRole === 'MANAGER'
    ? [{ value: 'EMPLOYEE', label: t('profile.roles.employee') }]
    : [
      { value: 'ADMIN', label: t('profile.roles.admin') },
      { value: 'MANAGER', label: t('profile.roles.manager') },
      { value: 'EMPLOYEE', label: t('profile.roles.employee') },
    ];

  return (
    <div
      style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        transition: 'box-shadow var(--transition), border-color var(--transition)',
        boxShadow: 'var(--shadow-xs)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-strong)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-xs)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={employee.fullName} size="md" />
          <div>
            <p style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {employee.fullName}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 1 }}>
              {employee.createdAtLabel}
            </p>
          </div>
        </div>
        <Badge variant={roleVariant[employee.role]}>
          {employee.role === 'ADMIN'
            ? t('profile.roles.admin')
            : employee.role === 'MANAGER'
              ? t('profile.roles.manager')
              : t('profile.roles.employee')}
        </Badge>
      </div>

      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {employee.email}
      </p>

      {canEditThisUser ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 6 }}>
          <div style={{ flex: 1 }}>
            <Select
              label={t('employees.role')}
              value={roleDraft}
              options={availableRoleOptions}
              onChange={(e) => setRoleDraft(e.target.value as Role)}
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            disabled={isUpdating || roleDraft === employee.role}
            onClick={() => updateUser(employee.id, { role: roleDraft })}
          >
            {t('common.actions.save')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={isDeleting}
            onClick={() => deleteUser(employee.id)}
          >
            {t('employees.actions.deactivate')}
          </Button>
        </div>
      ) : (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 8 }}>
          {isSelf ? t('employees.actions.self') : t('employees.actions.readonly')}
        </p>
      )}
    </div>
  );
}
