import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/components/ui';
import type { EmployeeUiModel } from '@entities/employees/employees.types';
import { BottomSheet } from './BottomSheet';
import styles from './ConfirmMemberSheet.module.css';
import sheetStyles from './sheet-overrides.module.css';

export type RemovalVariant = 'deactivate' | 'remove';

interface ConfirmMemberSheetProps {
  target: { employee: EmployeeUiModel; variant: RemovalVariant } | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function ConfirmMemberSheet({ target, onClose, onConfirm, isPending }: ConfirmMemberSheetProps) {
  const { t } = useTranslation();
  const isOpen = Boolean(target);
  const variant = target?.variant ?? 'deactivate';

  const title =
    variant === 'remove' ? t('employees.confirm.removeTitle') : t('employees.confirm.deactivateTitle');
  const body =
    variant === 'remove' ? t('employees.confirm.removeBody') : t('employees.confirm.deactivateBody');

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={target?.employee.displayName}
      footerClassName={sheetStyles.footerStack}
      footer={
        <>
          <Button variant="secondary" size="lg" onClick={onClose} disabled={isPending}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant="danger" size="lg" onClick={onConfirm} loading={isPending}>
            {variant === 'remove' ? t('employees.actions.remove') : t('employees.actions.deactivate')}
          </Button>
        </>
      }
    >
      <p className={styles.body}>{body}</p>
    </BottomSheet>
  );
}
