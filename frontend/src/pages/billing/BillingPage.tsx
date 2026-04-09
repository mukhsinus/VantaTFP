import React from 'react';
import { Badge, Card, EmptyState, PageSkeleton } from '@shared/components/ui';
import { useBillingSnapshot } from '@features/billing/hooks/useBilling';
import { BillingLimitsGrid } from '@features/billing/components/BillingLimitsGrid';

export function BillingPage() {
  const { data, isLoading, isError } = useBillingSnapshot();

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Billing unavailable"
        description="Could not load billing info."
      />
    );
  }

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ margin: 0 }}>Billing</h2>
        <p style={{ margin: '6px 0 0', color: 'var(--color-text-secondary)' }}>
          Current plan and limits for your tenant.
        </p>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>Tenant</p>
            <p style={{ margin: '4px 0 0', fontWeight: 700 }}>{data.tenantId}</p>
          </div>
          <Badge variant="accent">{data.planName}</Badge>
        </div>
      </Card>

      <BillingLimitsGrid limits={data.limits} />
      <Card>
        <p style={{ margin: 0, fontWeight: 600 }}>Current Usage</p>
        <p style={{ margin: '8px 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Users: {data.usage.users} · Tasks: {data.usage.tasks} · API/hour: {data.usage.apiRatePerHour}
        </p>
      </Card>
    </div>
  );
}
