import React from 'react';
import { Badge, Card, EmptyState, Skeleton } from '@shared/components/ui';
import { usePayrollRules } from '../hooks/usePayrollRules';
import { useTranslation } from 'react-i18next';

export function PayrollRulesPanel() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = usePayrollRules();

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
        {[1, 2, 3].map((x) => (
          <Skeleton key={x} height={84} borderRadius="var(--radius-lg)" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title={t('payroll.rules.unavailable.title')}
        description={t('payroll.rules.unavailable.description')}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={t('payroll.rules.empty.title')}
        description={t('payroll.rules.empty.description')}
      />
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
      {data.map((rule) => (
        <Card key={rule.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <p style={{ margin: 0, fontWeight: 600 }}>{rule.name || rule.type}</p>
            <Badge variant={rule.isActive ? 'success' : 'default'}>
              {rule.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
          </div>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {t('payroll.rules.typeLabel')} <strong>{rule.type}</strong>
            </p>
        </Card>
      ))}
    </div>
  );
}
