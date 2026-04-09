import React, { type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/components/ui';
import styles from './EmployeesInviteFab.module.css';

const fabStyle: CSSProperties = {
  width: 56,
  height: 56,
  minWidth: 56,
  minHeight: 56,
  padding: 0,
  borderRadius: '50%',
  boxShadow: 'var(--shadow-lg)',
};

interface EmployeesInviteFabProps {
  visible: boolean;
  onInvite: () => void;
}

/** Circular FAB; above mobile tab bar, corner on desktop. */
export function EmployeesInviteFab({ visible, onInvite }: EmployeesInviteFabProps) {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <div className={styles.wrap}>
      <Button
        variant="primary"
        size="lg"
        style={fabStyle}
        onClick={onInvite}
        aria-label={t('employees.invite')}
        title={t('employees.invite')}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Button>
    </div>
  );
}
