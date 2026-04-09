import React from 'react';
import { Card } from '@shared/components/ui';
import type { BillingLimitView } from '@entities/billing/billing.types';

function limitText(value: number | null): string {
  return value === null ? 'Unlimited' : String(value);
}

export function BillingLimitsGrid({ limits }: { limits: BillingLimitView }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
      <Card>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>Users</p>
        <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 700 }}>{limitText(limits.users)}</p>
      </Card>
      <Card>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>Tasks</p>
        <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 700 }}>{limitText(limits.tasks)}</p>
      </Card>
      <Card>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>API / hour</p>
        <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 700 }}>{limits.apiRatePerHour}</p>
      </Card>
    </div>
  );
}
