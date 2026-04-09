import React from 'react';
import { Badge, Card, EmptyState, Skeleton } from '@shared/components/ui';
import { usePayrollRules } from '../hooks/usePayrollRules';

export function PayrollRulesPanel() {
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
        title="Payroll rules unavailable"
        description="Unable to load payroll rules."
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No payroll rules"
        description="Create rules from backend admin to enable advanced payroll calculation."
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
            Type: <strong>{rule.type}</strong>
          </p>
        </Card>
      ))}
    </div>
  );
}
