import React from 'react';
import { Card, EmptyState, Skeleton } from '@shared/components/ui';
import { useKpiAnalytics } from '../hooks/useKpiAnalytics';
import type { Role } from '@shared/types/auth.types';

export function KpiAnalyticsPanel({ role, userId }: { role?: Role | null; userId?: string }) {
  const { aggregated, employees } = useKpiAnalytics({ role, userId });

  if (aggregated.isLoading || employees.isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 12 }}>
        {[1, 2, 3, 4].map((x) => (
          <Skeleton key={x} height={84} borderRadius="var(--radius-lg)" />
        ))}
      </div>
    );
  }

  if (aggregated.isError || employees.isError || !aggregated.data || !employees.data) {
    return (
      <EmptyState
        title="KPI analytics unavailable"
        description="Unable to load advanced KPI analytics right now."
      />
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 12 }}>
      <Card>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>Assignees</p>
        <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 700 }}>{aggregated.data.assigneeCount}</p>
      </Card>
      <Card>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>Completed Tasks</p>
        <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 700 }}>{aggregated.data.completedTasks}</p>
      </Card>
      <Card>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>Open Overdue</p>
        <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 700, color: 'var(--color-danger)' }}>
          {aggregated.data.openOverdueTasks}
        </p>
      </Card>
      <Card>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>Performance</p>
        <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 700, color: 'var(--color-accent)' }}>
          {aggregated.data.performancePercent.toFixed(2)}%
        </p>
      </Card>
    </div>
  );
}
