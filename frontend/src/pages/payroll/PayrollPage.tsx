import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Avatar, Card, EmptyState, PageSkeleton } from '@shared/components/ui';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { formatCurrency } from '@shared/utils/currency';
import { usePayroll } from '@features/payroll/hooks/usePayroll';
import { useApprovePayroll } from '@features/payroll/hooks/useApprovePayroll';
import type { PayrollStatus, PayrollApiDto } from '@entities/payroll/payroll.types';
import { PayrollRulesPanel } from '@features/payroll/components/PayrollRulesPanel';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';

const statusVariant: Record<PayrollStatus, 'success' | 'accent' | 'default' | 'danger'> = {
  PAID: 'success',
  APPROVED: 'accent',
  DRAFT: 'default',
  CANCELLED: 'danger',
};

export function PayrollPage() {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const { role } = useCurrentUser();
  const isAdmin = role === 'ADMIN';
  const title = role === 'EMPLOYEE' ? 'My Payroll' : t('payroll.title');
  const subtitle = role === 'EMPLOYEE' ? 'Your payroll statements and status.' : t('payroll.subtitle');

  const { payroll, isLoading, isError } = usePayroll();
  const { approvePayroll, isPending } = useApprovePayroll();
  const localeBase = (i18n.resolvedLanguage ?? i18n.language ?? 'ru').split('-')[0];
  const locale: 'ru' | 'uz' | 'en' =
    localeBase === 'ru' || localeBase === 'uz' || localeBase === 'en' ? localeBase : 'en';
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | 'ALL'>('ALL');
  const statusLabel = (status: PayrollStatus | 'ALL') => {
    if (status === 'ALL') return t('common.all');
    if (status === 'DRAFT') return t('status.draft');
    if (status === 'APPROVED') return t('status.approved');
    if (status === 'PAID') return t('status.paid');
    return t('status.cancelled');
  };

  const filtered = statusFilter === 'ALL' ? payroll : payroll.filter((p) => p.status === statusFilter);
  const totalNet = filtered.reduce((sum, p) => sum + p.netSalary, 0);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {title}
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {subtitle}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: t('payroll.stats.totalNet'), value: formatCurrency(totalNet, locale), accent: 'var(--color-accent)' },
          { label: t('payroll.stats.paid'), value: String(payroll.filter((p) => p.status === 'PAID').length), accent: 'var(--color-success)' },
          { label: t('payroll.stats.pending'), value: String(payroll.filter((p) => p.status === 'APPROVED').length), accent: 'var(--color-warning)' },
          { label: t('payroll.stats.drafts'), value: String(payroll.filter((p) => p.status === 'DRAFT').length), accent: 'var(--color-gray-400)' },
        ].map((s) => (
          <Card key={s.label}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              {s.label}
            </p>
            <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: s.accent }}>
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {isAdmin && <PayrollRulesPanel />}

      {/* Filters */}
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          overflowX: isMobile ? 'auto' : 'visible',
          overflowY: 'hidden',
          boxSizing: 'border-box',
          paddingBottom: isMobile ? 2 : 0,
        }}
      >
      <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', width: 'max-content', minWidth: '100%' }}>
        {(['ALL', 'DRAFT', 'APPROVED', 'PAID', 'CANCELLED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: isMobile ? '8px 12px' : '5px 12px',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              borderRadius: 'var(--radius-full)',
              border: '1px solid',
              cursor: 'pointer',
              transition: 'all var(--transition)',
              background: statusFilter === s ? 'var(--color-accent)' : 'var(--color-bg)',
              color: statusFilter === s ? '#fff' : 'var(--color-text-secondary)',
              borderColor: statusFilter === s ? 'var(--color-accent)' : 'var(--color-border-strong)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {statusLabel(s)}
          </button>
        ))}
      </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState
          title={t('payroll.empty.title')}
          description={t('payroll.empty.description')}
        />
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: '100%' }}>
          {filtered.map((entry) => (
            <Card key={entry.id}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {formatPeriod(entry.periodStart, entry.periodEnd, locale)}
                    </p>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 'var(--text-base)',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {entry.employeeId}
                    </p>
                  </div>
                  <Badge variant={statusVariant[entry.status]} dot>{statusLabel(entry.status)}</Badge>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 'var(--text-3xl)',
                      fontWeight: 700,
                      lineHeight: 1.1,
                      color: 'var(--color-text-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {formatCurrency(entry.netSalary, locale)}
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    {t('payroll.table.baseSalary')}: <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(entry.baseSalary, locale)}</span>
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 'var(--text-sm)',
                      color: entry.bonuses > 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
                    }}
                  >
                    {t('payroll.table.bonuses')}: {entry.bonuses > 0 ? '+' : ''}{formatCurrency(entry.bonuses, locale)}
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-danger)' }}>
                    {t('payroll.table.deductions')}: -{formatCurrency(entry.deductions, locale)}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                  {isAdmin && entry.status === 'DRAFT' && (
                    <Button
                      variant="secondary"
                      style={{ width: '100%', minHeight: 44 }}
                      onClick={() => approvePayroll(entry.id)}
                      disabled={isPending}
                    >
                      {t('payroll.action.approve')}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {filtered.map((entry) => (
            <Card key={entry.id}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <Avatar name={entry.employeeId} size="xs" />
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {entry.employeeId}
                    </span>
                  </div>
                  <Badge variant={statusVariant[entry.status]} dot>{statusLabel(entry.status)}</Badge>
                </div>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {formatPeriod(entry.periodStart, entry.periodEnd, locale)}
                </p>
                <p style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {formatCurrency(entry.netSalary, locale)}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    {t('payroll.table.baseSalary')}: {formatCurrency(entry.baseSalary, locale)}
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: entry.bonuses > 0 ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                    {t('payroll.table.bonuses')}: {entry.bonuses > 0 ? '+' : ''}{formatCurrency(entry.bonuses, locale)}
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-danger)' }}>
                    {t('payroll.table.deductions')}: -{formatCurrency(entry.deductions, locale)}
                  </p>
                </div>
                {isAdmin && entry.status === 'DRAFT' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => approvePayroll(entry.id)}
                    disabled={isPending}
                    loading={isPending}
                  >
                    {t('payroll.action.approve')}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function formatPeriod(periodStart: string, periodEnd: string, locale: 'ru' | 'uz' | 'en') {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${periodStart} - ${periodEnd}`;
  }

  return `${start.toLocaleDateString(locale)} - ${end.toLocaleDateString(locale)}`;
}
