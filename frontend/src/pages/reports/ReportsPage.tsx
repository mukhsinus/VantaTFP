import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, EmptyState, PageSkeleton } from '@shared/components/ui';
import { useExportReport, useGenerateReport, useReportHistory } from '@features/reports/hooks/useReports';
import type { ReportType } from '@entities/reports/reports.types';
import { ReportBuilderCard } from '@features/reports/components/ReportBuilderCard';

const now = new Date();
const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
const defaultTo = now.toISOString().slice(0, 10);

export function ReportsPage() {
  const { t } = useTranslation();
  const [type, setType] = useState<ReportType>('KPI');
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [userId, setUserId] = useState('');
  const [teamId, setTeamId] = useState('');

  const history = useReportHistory(type);
  const generate = useGenerateReport();
  const exportReport = useExportReport();

  const filters = useMemo(
    () => ({
      type,
      dateFrom: new Date(`${dateFrom}T00:00:00.000Z`).toISOString(),
      dateTo: new Date(`${dateTo}T23:59:59.999Z`).toISOString(),
      ...(userId.trim() ? { userId: userId.trim() } : {}),
      ...(teamId.trim() ? { teamId: teamId.trim() } : {}),
    }),
    [type, dateFrom, dateTo, userId, teamId]
  );

  const isBusy = generate.isPending || exportReport.isPending;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ margin: 0 }}>{t('reports.title')}</h2>
        <p style={{ margin: '6px 0 0', color: 'var(--color-text-secondary)' }}>{t('reports.subtitle')}</p>
      </div>

      <ReportBuilderCard
        type={type}
        setType={setType}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        userId={userId}
        setUserId={setUserId}
        teamId={teamId}
        setTeamId={setTeamId}
        onGenerate={() => generate.mutate(filters)}
        onExportCsv={() => exportReport.mutate({ ...filters, format: 'csv' })}
        onExportPdf={() => exportReport.mutate({ ...filters, format: 'pdf' })}
        isPending={isBusy}
      />

      <Card>
        <h3 style={{ marginTop: 0 }}>{t('reports.history.title', { type })}</h3>
        {isBusy && (
          <p style={{ margin: '0 0 10px', color: 'var(--color-accent)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
            {t('reports.history.processing')}
          </p>
        )}
        {generate.isError || exportReport.isError ? (
          <EmptyState title={t('reports.errors.actionFailed.title')} description={t('reports.errors.actionFailed.description')} />
        ) : null}
        {history.isLoading ? (
          <PageSkeleton />
        ) : history.isError ? (
          <EmptyState
            title={t('reports.errors.loadFailed.title')}
            description={t('reports.errors.loadFailed.description')}
            action={{ label: t('common.actions.retry'), onClick: () => void history.refetch() }}
          />
        ) : !history.data?.data?.length ? (
          <EmptyState title={t('reports.empty.title')} description={t('reports.empty.description')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.data.data.map((item) => (
              <div
                key={item.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  padding: 10,
                  background: 'var(--color-bg-subtle)',
                }}
              >
                <p style={{ margin: 0, fontWeight: 600 }}>
                  {item.reportType} • {item.format}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Generated at {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
