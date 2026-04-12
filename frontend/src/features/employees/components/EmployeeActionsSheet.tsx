import React from 'react';
import { useTranslation } from 'react-i18next';
import type { EmployeeUiModel } from '@entities/employees/employees.types';
import { BottomSheet } from './BottomSheet';
import styles from './EmployeeActionsSheet.module.css';

interface EmployeeActionsSheetProps {
  employee: EmployeeUiModel | null;
  onClose: () => void;
  canChangeRole: boolean;
  canDeactivate: boolean;
  onChangeRole: () => void;
  onDeactivate: () => void;
  onRemove: () => void;
}

export function EmployeeActionsSheet({
  employee,
  onClose,
  canChangeRole,
  canDeactivate,
  onChangeRole,
  onDeactivate,
  onRemove,
}: EmployeeActionsSheetProps) {
  const { t } = useTranslation();
  const isOpen = Boolean(employee);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t('employees.sheet.actionsTitle')}
      subtitle={employee?.email}
    >
      <div className={styles.list}>
        {canChangeRole ? (
          <button type="button" className={styles.row} onClick={onChangeRole}>
            <span className={styles.icon} aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            {t('employees.actions.changeRole')}
          </button>
        ) : null}
        {canDeactivate ? (
          <>
            <button type="button" className={`${styles.row} ${styles.rowDanger}`} onClick={onDeactivate}>
              <span className={styles.icon} aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12h8" />
                </svg>
              </span>
              {t('employees.actions.deactivate')}
            </button>
            <button type="button" className={`${styles.row} ${styles.rowDanger}`} onClick={onRemove}>
              <span className={styles.icon} aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                </svg>
              </span>
              {t('employees.actions.remove')}
            </button>
          </>
        ) : null}
      </div>
    </BottomSheet>
  );
}
