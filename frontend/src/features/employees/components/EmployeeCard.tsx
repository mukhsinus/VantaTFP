import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Avatar } from '@shared/components/ui';
import type { EmployeeUiModel } from '@entities/employees/employees.types';
import type { TenantRole } from '@entities/employees/employees.types';
import { usePermissions } from '@shared/hooks/useCanPerform';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { EmployeeActionsSheet } from './EmployeeActionsSheet';
import styles from './EmployeeCard.module.css';

const roleVariant: Record<TenantRole, 'danger' | 'warning' | 'success'> = {
  owner: 'danger',
  manager: 'warning',
  employee: 'success',
};

interface EmployeeCardProps {
  employee: EmployeeUiModel;
  currentUserId: string | null;
  onOpenRoleSheet: (employee: EmployeeUiModel) => void;
  onRequestRemoval: (employee: EmployeeUiModel, variant: 'deactivate' | 'remove') => void;
}

export function EmployeeCard({ employee, currentUserId, onOpenRoleSheet, onRequestRemoval }: EmployeeCardProps) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { isAdmin, isManager } = useCurrentUser();
  const [actionsOpen, setActionsOpen] = useState(false);

  const isSelf = currentUserId === employee.id;
  const isOwnerRow = employee.isOwner || employee.role === 'owner';

  const canChangeRole = can('employee:changeRole') && !isSelf && !isOwnerRow;
  const canDeactivate =
    can('employee:deactivate') &&
    !isSelf &&
    !isOwnerRow &&
    (isAdmin || (isManager && employee.role === 'employee'));

  const showMenu = canChangeRole || canDeactivate;

  const roleLabel =
    employee.role === 'owner'
      ? t('employees.roles.owner')
      : t(`employees.roles.${employee.role}`);

  return (
    <article className={styles.card}>
      <div className={styles.row}>
        <div className={styles.identity}>
          <Avatar name={employee.displayName} size="md" />
          <div className={styles.textBlock}>
            <div className={styles.nameRow}>
              <p className={styles.name}>{employee.displayName}</p>
              <Badge variant={roleVariant[employee.role]}>{roleLabel}</Badge>
            </div>
            <p className={styles.email}>{employee.phone?.trim() || employee.email}</p>
          </div>
        </div>
        {showMenu ? (
          <button
            type="button"
            className={styles.menuBtn}
            aria-label={t('employees.actions.openMenu')}
            aria-haspopup="dialog"
            aria-expanded={actionsOpen}
            onClick={() => setActionsOpen(true)}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        ) : null}
      </div>

      {isOwnerRow ? <p className={styles.hint}>{t('employees.ownerLockedHint')}</p> : null}
      {isSelf && !isOwnerRow ? <p className={styles.hint}>{t('employees.actions.self')}</p> : null}
      {!isOwnerRow && !isSelf && !showMenu ? <p className={styles.hint}>{t('employees.actions.readonly')}</p> : null}

      <EmployeeActionsSheet
        employee={actionsOpen ? employee : null}
        onClose={() => setActionsOpen(false)}
        canChangeRole={canChangeRole}
        canDeactivate={canDeactivate}
        onChangeRole={() => {
          setActionsOpen(false);
          onOpenRoleSheet(employee);
        }}
        onDeactivate={() => {
          setActionsOpen(false);
          onRequestRemoval(employee, 'deactivate');
        }}
        onRemove={() => {
          setActionsOpen(false);
          onRequestRemoval(employee, 'remove');
        }}
      />
    </article>
  );
}
