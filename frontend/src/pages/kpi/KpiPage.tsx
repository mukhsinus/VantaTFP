import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Card, EmptyState, PageSkeleton } from '@shared/components/ui';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useKpis } from '@features/kpi/hooks/useKpis';
import type { KpiApiDto, KpiPeriod } from '@entities/kpi/kpi.types';

export function KpiPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { kpis, isLoading, isError } = useKpis();
  const [period, setPeriod] = useState<KpiPeriod | 'ALL'>('ALL');
  const periodLabel = (value: KpiPeriod | 'ALL') => {
    if (value === 'ALL') return t('kpi.period.all');
    if (value === 'WEEKLY') return t('kpi.period.weekly');
    if (value === 'MONTHLY') return t('kpi.period.monthly');
    return t('kpi.period.quarterly');
  };

  const filtered = useMemo(
    () => (period === 'ALL' ? kpis : kpis.filter((kpi) => kpi.period === period)),
    [period, kpis]
  );

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    return (
      <EmptyState
        title={t('errors.loadFailed.title')}
        description={t('errors.loadFailed.description')}
      />
    );
  }

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
        <Badge variant="default">{filtered.length}</Badge>
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
              {periodLabel(p)}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          {t('kpi.subtitle')}
        </p>
      </div>

      {/* KPI cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {filtered.length === 0 ? (
          <EmptyState title={t('kpi.title')} description={t('kpi.subtitle')} />
        ) : (
          filtered.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)
        )}
      </div>
    </div>
  );
}

function KpiCard({ kpi }: { kpi: KpiApiDto }) {
  const { t } = useTranslation();

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {kpi.name}
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {kpi.description ?? '-'}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <Badge variant="default" style={{ fontSize: 10 }}>
            {kpi.period === 'WEEKLY'
              ? t('kpi.period.weekly')
              : kpi.period === 'MONTHLY'
                ? t('kpi.period.monthly')
                : kpi.period === 'QUARTERLY'
                  ? t('kpi.period.quarterly')
                  : 'Yearly'}
          </Badge>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{t('kpi.target')}</p>
          <p style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {kpi.targetValue.toLocaleString()} <span style={{ fontSize: 'var(--text-xs)', fontWeight: 400 }}>{kpi.unit}</span>
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Assignee</p>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            {kpi.assigneeId}
          </p>
        </div>
      </div>
    </Card>
  );
}
