import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, Badge, Skeleton } from '@shared/components/ui';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { useTasks } from '@features/tasks/hooks/useTasks';
import { usePayroll } from '@features/payroll/hooks/usePayroll';
import { useReportHistory } from '@features/reports/hooks/useReports';
import { useKpiAnalytics } from '@features/kpi/hooks/useKpiAnalytics';

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: string;
}

function StatCard({ label, value, accent = 'var(--color-accent)' }: StatCardProps) {
  return (
    <Card>
      <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{label}</p>
      <p style={{ margin: '6px 0 0', fontSize: 'var(--text-2xl)', fontWeight: 700, color: accent }}>{value}</p>
    </Card>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { role } = useCurrentUser();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = window.setTimeout(() => setStage(1), 150);
    const t2 = window.setTimeout(() => setStage(2), 350);
    const t3 = window.setTimeout(() => setStage(3), 700);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  const { tasks, isLoading: tasksLoading } = useTasks({}, { enabled: true });
  const { payroll } = usePayroll({ enabled: stage >= 1 });
  const { data: history } = useReportHistory(undefined, { enabled: stage >= 2 });
  const { aggregated } = useKpiAnalytics({ role, enabled: stage >= 3 });

  if (tasksLoading) {
    return <Skeleton height={260} borderRadius="var(--radius-lg)" />;
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'DONE').length;
  const overdueTasks = tasks.filter((task) => task.overdue).length;
  const inProgressTasks = tasks.filter((task) => task.status === 'IN_PROGRESS' || task.status === 'IN_REVIEW').length;
  const payrollTotal = payroll.reduce((sum, item) => sum + item.netSalary, 0);
  const performance = aggregated.data?.performancePercent ?? 0;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 'var(--text-2xl)' }}>{t('dashboard.title')}</h2>
        <p style={{ margin: '6px 0 0', color: 'var(--color-text-secondary)' }}>{t('dashboard.subtitle')}</p>
      </div>

      <div className="responsive-grid" style={{ gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, minmax(180px, 1fr))' }}>
        <StatCard label={t('dashboard.totalTasks')} value={totalTasks} />
        <StatCard label={t('dashboard.completedTasks')} value={completedTasks} accent="var(--color-success)" />
        <StatCard label={t('dashboard.overdueTasks')} value={overdueTasks} accent="var(--color-danger)" />
        <StatCard label={t('dashboard.inProgress')} value={inProgressTasks} accent="var(--color-warning)" />
      </div>

      <div className="responsive-grid" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(260px, 1fr))' }}>
        <Card>
          <CardHeader title={t('dashboard.kpiSummary')} subtitle={t('dashboard.kpiSubtitle')} />
          <p style={{ margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 700 }}>{performance.toFixed(2)}%</p>
          <p style={{ marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            {t('dashboard.kpiAssignees', { count: aggregated.data?.assigneeCount ?? 0 })} · {t('dashboard.kpiCompleted', { count: aggregated.data?.completedTasks ?? 0 })}
          </p>
        </Card>
        <Card>
          <CardHeader title={t('dashboard.payrollSummary')} subtitle={t('dashboard.payrollSubtitle')} />
          <p style={{ margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 700 }}>{payrollTotal.toLocaleString()}</p>
          <p style={{ marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            {t('dashboard.payrollEntries', { count: payroll.length })}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader title={t('dashboard.recentTasks')} subtitle={t('dashboard.recentTasksSubtitle')} />
        {tasks.slice(0, 5).map((task) => (
          <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{task.title}</p>
              <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{task.assignee}</p>
            </div>
            <Badge variant={task.overdue ? 'danger' : 'default'}>
              {t(`status.${task.status.toLowerCase()}`)}
            </Badge>
          </div>
        ))}
      </Card>

      <Card>
        <CardHeader title={t('dashboard.reportsActivity')} subtitle={t('dashboard.reportsActivitySubtitle')} />
        <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>{t('dashboard.generatedReports', { count: history?.data?.length ?? 0 })}</p>
      </Card>
    </div>
  );
}
