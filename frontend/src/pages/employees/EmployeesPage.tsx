import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, EmptyState, Button } from '@shared/components/ui';
import { useEmployees } from '@features/employees/hooks/useEmployees';
import { useDeleteEmployee } from '@features/employees/hooks/useDeleteEmployee';
import { CreateUserModal } from '@features/users/components/CreateUserModal';
import { usePermissions } from '@shared/hooks/useCanPerform';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { ApiError } from '@shared/api/client';
import { useBilling } from '@features/billing/hooks/useBilling';
import type { TenantRole } from '@entities/employees/employees.types';
import type { EmployeeUiModel } from '@entities/employees/employees.types';
import { EmployeeCard } from '@features/employees/components/EmployeeCard';
import { EmployeesInviteFab } from '@features/employees/components/EmployeesInviteFab';
import { RoleChangeBottomSheet } from '@features/employees/components/RoleChangeBottomSheet';
import { ConfirmMemberSheet } from '@features/employees/components/ConfirmMemberSheet';
import type { RemovalVariant } from '@features/employees/components/ConfirmMemberSheet';
import { EmployeesListSkeleton } from '@features/employees/components/EmployeesListSkeleton';

type RoleFilter = TenantRole | 'ALL';

export function EmployeesPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { employees, isLoading, isError, error } = useEmployees();
  const { can } = usePermissions();
  const { role: currentRole, user: currentUser } = useCurrentUser();
  const { deleteEmployeeAsync, isPending: isRemoving } = useDeleteEmployee();
  const canAddEmployeeByRole =
    String(currentRole ?? '').toUpperCase() === 'ADMIN' || String(currentRole ?? '').toUpperCase() === 'OWNER';
  const { data: billing } = useBilling({ enabled: canAddEmployeeByRole });

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roleSheetEmployee, setRoleSheetEmployee] = useState<EmployeeUiModel | null>(null);
  const [confirmRemoval, setConfirmRemoval] = useState<{
    employee: EmployeeUiModel;
    variant: RemovalVariant;
  } | null>(null);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchSearch = `${e.displayName} ${e.email} ${e.phone ?? ''}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchRole = roleFilter === 'ALL' || e.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [employees, search, roleFilter]);

  const isEmployeeLimitReached = Boolean(
    billing &&
      billing.limits.users != null &&
      billing.limits.users > 0 &&
      billing.usage.users >= billing.limits.users
  );
  const showAddEmployeeButton = canAddEmployeeByRole;
  const disableAddEmployee = showAddEmployeeButton && isEmployeeLimitReached;
  const showFab = can('employee:invite') && !disableAddEmployee;

  const handleConfirmRemoval = async () => {
    if (!confirmRemoval) return;
    try {
      await deleteEmployeeAsync(confirmRemoval.employee.id);
      setConfirmRemoval(null);
    } catch {
      /* toast from hook; optimistic rollback */
    }
  };

  if (isLoading) return <EmployeesListSkeleton />;

  if (isError) {
    if (error instanceof ApiError && error.statusCode === 401) {
      return <EmployeesListSkeleton />;
    }

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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 14 : 20,
          paddingBottom: showFab
            ? isMobile
              ? 'calc(72px + 16px + 56px + 20px + env(safe-area-inset-bottom, 0px))'
              : 'calc(32px + 56px + env(safe-area-inset-bottom, 0px))'
            : undefined,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: isMobile ? 'stretch' : 'flex-start',
            justifyContent: 'space-between',
            gap: 10,
            flexDirection: isMobile ? 'column' : 'row',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: isMobile ? 'var(--text-xl)' : 'var(--text-2xl)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
              }}
            >
              {t('employees.title')}
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
              {employees.length} {t('employees.total')}
            </p>
          </div>

          {showAddEmployeeButton ? (
            <Button
              variant="primary"
              size={isMobile ? 'lg' : 'sm'}
              onClick={() => setShowCreateModal(true)}
              disabled={disableAddEmployee}
              title={disableAddEmployee ? t('employees.limitReached') : undefined}
              style={isMobile ? { width: '100%' } : undefined}
            >
              + {t('employees.add')}
            </Button>
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ flex: 1, maxWidth: isMobile ? '100%' : 300, width: '100%' }}>
            <Input
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              }
            />
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              width: isMobile ? '100%' : undefined,
              overflowX: isMobile ? 'auto' : undefined,
              paddingBottom: 2,
            }}
          >
            {(['ALL', 'owner', 'manager', 'employee'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                aria-pressed={roleFilter === r}
                style={{
                  padding: '10px 16px',
                  minHeight: 44,
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                  background: roleFilter === r ? 'var(--color-accent)' : 'var(--color-bg)',
                  color: roleFilter === r ? '#fff' : 'var(--color-text-secondary)',
                  borderColor: roleFilter === r ? 'var(--color-accent)' : 'var(--color-border-strong)',
                  flexShrink: 0,
                }}
              >
                {r === 'ALL' ? t('employees.filters.all') : t(`employees.roles.${r}`)}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={t('employees.empty.title')}
            description={t('employees.empty.description')}
            action={
              showAddEmployeeButton && !disableAddEmployee
                ? { label: `+ ${t('employees.add')}`, onClick: () => setShowCreateModal(true) }
                : undefined
            }
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
                currentUserId={currentUser?.userId ?? null}
                onOpenRoleSheet={setRoleSheetEmployee}
                onRequestRemoval={(emp, variant) => setConfirmRemoval({ employee: emp, variant })}
              />
            ))}
          </div>
        )}
      </div>

      <EmployeesInviteFab visible={showFab} onInvite={() => setShowCreateModal(true)} />
      <RoleChangeBottomSheet employee={roleSheetEmployee} onClose={() => setRoleSheetEmployee(null)} />
      <ConfirmMemberSheet
        target={confirmRemoval}
        onClose={() => setConfirmRemoval(null)}
        onConfirm={handleConfirmRemoval}
        isPending={isRemoving}
      />

      {currentRole ? (
        <CreateUserModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} creatorRole={currentRole} />
      ) : null}
    </>
  );
}
