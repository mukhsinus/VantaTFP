import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Avatar, Card, CardHeader, EmptyState } from '@shared/components/ui';
import { useIsMobile } from '@shared/hooks/useIsMobile';

type KpiPeriod = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';

interface KpiMetric {
  id: string;
  name: string;
  assignee: string;
  targetValue: number;
  actualValue: number;
  unit: string;
  period: KpiPeriod;
  trend: 'up' | 'down' | 'stable';
}

const mockKpis: KpiMetric[] = [
  { id: '1', name: 'Sales Closed', assignee: 'Luca Ferrari', targetValue: 20, actualValue: 17, unit: 'deals', period: 'MONTHLY', trend: 'up' },
  { id: '2', name: 'Customer Satisfaction', assignee: 'Sofia Chen', targetValue: 90, actualValue: 86, unit: '%', period: 'MONTHLY', trend: 'stable' },
  { id: '3', name: 'Tasks Completed', assignee: 'Amara Diallo', targetValue: 50, actualValue: 31, unit: 'tasks', period: 'MONTHLY', trend: 'up' },
  { id: '4', name: 'Response Time', assignee: 'James Park', targetValue: 2, actualValue: 3.2, unit: 'hrs', period: 'WEEKLY', trend: 'down' },
  { id: '5', name: 'Revenue Target', assignee: 'Maria Santos', targetValue: 100000, actualValue: 78000, unit: '$', period: 'QUARTERLY', trend: 'up' },
];

function getProgress(actual: number, target: number): number {
  return Math.min(100, Math.round((actual / target) * 100));
}

function progressColor(pct: number): string {
  if (pct >= 90) return 'var(--color-success)';
  if (pct >= 60) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

export function KpiPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [period, setPeriod] = useState<KpiPeriod | 'ALL'>('ALL');

  const filtered = period === 'ALL' ? mockKpis : mockKpis.filter((k) => k.period === period);
  const avgProgress = Math.round(filtered.reduce((sum, k) => sum + getProgress(k.actualValue, k.targetValue), 0) / (filtered.length || 1));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20, width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 10 : 0 }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {t('kpi.title')}
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {t('kpi.subtitle')}
          </p>
        </div>
        <Button variant="primary" size="sm"
          leftIcon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 5v14M5 12h14" />
            </svg>
          }
        >
          {t('kpi.create')}
        </Button>
      </div>

      {/* Summary + filter row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: '100%' }}>
          {(['ALL', 'WEEKLY', 'MONTHLY', 'QUARTERLY'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '5px 12px',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                cursor: 'pointer',
                transition: 'all var(--transition)',
                background: period === p ? 'var(--color-accent)' : 'var(--color-bg)',
                color: period === p ? '#fff' : 'var(--color-text-secondary)',
                borderColor: period === p ? 'var(--color-accent)' : 'var(--color-border-strong)',
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            {t('kpi.avgProgress')}
          </span>
          <span
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 700,
              color: progressColor(avgProgress),
            }}
          >
            {avgProgress}%
          </span>
        </div>
      </div>

      {/* KPI cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {filtered.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)}
      </div>
    </div>
  );
}

const trendIcon = {
  up: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth={2.5}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  down: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth={2.5}>
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
    </svg>
  ),
  stable: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth={2.5}>
      <path d="M5 12h14" />
    </svg>
  ),
};

function KpiCard({ kpi }: { kpi: KpiMetric }) {
  const pct = getProgress(kpi.actualValue, kpi.targetValue);
  const color = progressColor(pct);

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {kpi.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Avatar name={kpi.assignee} size="xs" />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              {kpi.assignee}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {trendIcon[kpi.trend]}
            <Badge variant="default" style={{ fontSize: 10 }}>
              {kpi.period}
            </Badge>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Progress</span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color }}>
            {pct}%
          </span>
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-bg-muted)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: color,
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.8s ease',
            }}
          />
        </div>
      </div>

      {/* Values */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Actual</p>
          <p style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color }}>
            {kpi.actualValue.toLocaleString()} <span style={{ fontSize: 'var(--text-xs)', fontWeight: 400 }}>{kpi.unit}</span>
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Target</p>
          <p style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
            {kpi.targetValue.toLocaleString()} <span style={{ fontSize: 'var(--text-xs)', fontWeight: 400 }}>{kpi.unit}</span>
          </p>
        </div>
      </div>
    </Card>
  );
}
