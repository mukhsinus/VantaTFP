import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, Badge, Avatar, Skeleton } from '@shared/components/ui';
import { useIsMobile } from '@shared/hooks/useIsMobile';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: { value: string; positive: boolean };
  icon: React.ReactNode;
  accent?: string;
}

function StatCard({ label, value, delta, icon, accent = 'var(--color-accent)' }: StatCardProps) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
            {label}
          </p>
          <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>
            {value}
          </p>
          {delta && (
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: delta.positive ? 'var(--color-success)' : 'var(--color-danger)',
                marginTop: 6,
                fontWeight: 500,
              }}
            >
              {delta.positive ? '↑' : '↓'} {delta.value}
            </p>
          )}
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-lg)',
            background: accent + '18',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accent,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

const mockActivity = [
  { id: '1', user: 'Sofia Chen', action: 'completed task', target: 'Q1 Report Draft', time: '2m ago', type: 'success' as const },
  { id: '2', user: 'James Park', action: 'created task', target: 'Client Onboarding Flow', time: '15m ago', type: 'accent' as const },
  { id: '3', user: 'Amara Diallo', action: 'task is overdue', target: 'Invoice Processing', time: '1h ago', type: 'danger' as const },
  { id: '4', user: 'Luca Ferrari', action: 'updated KPI', target: 'Monthly Sales Target', time: '2h ago', type: 'warning' as const },
  { id: '5', user: 'Maria Santos', action: 'completed task', target: 'Team Review Meeting', time: '3h ago', type: 'success' as const },
];

const typeToVariant = {
  success: 'success',
  accent: 'accent',
  danger: 'danger',
  warning: 'warning',
} as const;

export function DashboardPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 24, width: '100%', maxWidth: '100%' }}>
      {/* Page header */}
      <div>
        <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {t('dashboard.title')}
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <StatCard
          label={t('dashboard.stats.totalTasks')}
          value={48}
          delta={{ value: '12% this week', positive: true }}
          accent="var(--color-accent)"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          }
        />
        <StatCard
          label={t('dashboard.stats.completed')}
          value={31}
          delta={{ value: '8% this week', positive: true }}
          accent="var(--color-success)"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
              <circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" />
            </svg>
          }
        />
        <StatCard
          label={t('dashboard.stats.overdue')}
          value={5}
          delta={{ value: '2 since yesterday', positive: false }}
          accent="var(--color-danger)"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
          }
        />
        <StatCard
          label={t('dashboard.stats.inProgress')}
          value={12}
          accent="var(--color-warning)"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: 16, width: '100%', maxWidth: '100%' }}>
        {/* Recent activity */}
        <Card>
          <CardHeader title={t('dashboard.activity.title')} subtitle={t('dashboard.activity.subtitle')} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {mockActivity.map((item, index) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: index < mockActivity.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}
              >
                <Avatar name={item.user} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                    <strong style={{ fontWeight: 500 }}>{item.user}</strong>
                    {' '}
                    <span style={{ color: 'var(--color-text-secondary)' }}>{item.action}</span>
                    {' '}
                    <span
                      style={{
                        color: 'var(--color-accent)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 200,
                        display: 'inline-block',
                        verticalAlign: 'bottom',
                      }}
                    >
                      {item.target}
                    </span>
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Badge variant={typeToVariant[item.type]} dot>
                    {item.type}
                  </Badge>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <CardHeader title={t('dashboard.overdue.title')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Invoice Processing', 'Budget Review Q4', 'Team Feedback Session'].map((task) => (
                <div
                  key={task}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    background: 'var(--color-danger-subtle)',
                    border: '1px solid var(--color-danger-border)',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ color: 'var(--color-danger)', flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                    </svg>
                  </span>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-danger)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title={t('dashboard.progress.title')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Completed', value: 31, total: 48, color: 'var(--color-success)' },
                { label: 'In Progress', value: 12, total: 48, color: 'var(--color-warning)' },
                { label: 'Overdue', value: 5, total: 48, color: 'var(--color-danger)' },
              ].map((item) => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                      {item.value}/{item.total}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-bg-muted)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(item.value / item.total) * 100}%`,
                        background: item.color,
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.8s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
