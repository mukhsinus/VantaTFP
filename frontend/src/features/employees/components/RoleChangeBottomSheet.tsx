import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/components/ui';
import type { EmployeeUiModel } from '@entities/employees/employees.types';
import { usePatchEmployeeRole } from '../hooks/usePatchEmployeeRole';
import { BottomSheet } from './BottomSheet';
import sheetStyles from './sheet-overrides.module.css';
import styles from './RoleChangeBottomSheet.module.css';

const ROLES = [
  { value: 'manager' as const, labelKey: 'employees.roles.manager' },
  { value: 'employee' as const, labelKey: 'employees.roles.employee' },
];

interface RoleChangeBottomSheetProps {
  employee: EmployeeUiModel | null;
  onClose: () => void;
}

export function RoleChangeBottomSheet({ employee, onClose }: RoleChangeBottomSheetProps) {
  const { t } = useTranslation();
  const { patchRoleAsync, isPending } = usePatchEmployeeRole();
  const [draft, setDraft] = useState<'manager' | 'employee'>('employee');

  useEffect(() => {
    if (!employee) return;
    setDraft(employee.role === 'employee' ? 'employee' : 'manager');
  }, [employee]);

  const isOpen = Boolean(employee);
  const unchanged = employee && employee.role !== 'owner' && draft === employee.role;

  const handleSave = async () => {
    if (!employee || unchanged) return;
    try {
      await patchRoleAsync(employee.id, draft);
      onClose();
    } catch {
      /* toast from hook */
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t('employees.sheet.changeRoleTitle')}
      subtitle={employee?.phone?.trim() || employee?.email}
      footerClassName={sheetStyles.footerStack}
      footer={
        <>
          <Button variant="secondary" size="lg" onClick={onClose} disabled={isPending}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant="primary" size="lg" onClick={handleSave} loading={isPending} disabled={Boolean(unchanged)}>
            {t('common.actions.save')}
          </Button>
        </>
      }
    >
      <p className={styles.legend}>{t('employees.role')}</p>
      <div className={styles.options} role="listbox" aria-label={t('employees.role')}>
        {ROLES.map((r) => {
          const selected = draft === r.value;
          return (
            <button
              key={r.value}
              type="button"
              role="option"
              aria-selected={selected}
              className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
              onClick={() => setDraft(r.value)}
            >
              <span>{t(r.labelKey)}</span>
              {selected ? (
                <span className={styles.check} aria-hidden>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
              ) : (
                <span style={{ width: 22, height: 22, flexShrink: 0 }} aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
