import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Avatar, Card, CardHeader, EmptyState } from '@shared/components/ui';
import { useIsMobile } from '@shared/hooks/useIsMobile';

type PayrollStatus = 'DRAFT' | 'APPROVED' | 'PAID' | 'CANCELLED';

interface PayrollEntry {
  id: string;
  employee: string;
  period: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: PayrollStatus;
}

const mockPayroll: PayrollEntry[] = [
  { id: '1', employee: 'Sofia Chen', period: 'Mar 2026', baseSalary: 6000, bonuses: 500, deductions: 300, netSalary: 6200, status: 'PAID' },
  { id: '2', employee: 'James Park', period: 'Mar 2026', baseSalary: 4500, bonuses: 200, deductions: 225, netSalary: 4475, status: 'APPROVED' },
  { id: '3', employee: 'Amara Diallo', period: 'Mar 2026', baseSalary: 4200, bonuses: 0, deductions: 210, netSalary: 3990, status: 'DRAFT' },
  { id: '4', employee: 'Luca Ferrari', period: 'Mar 2026', baseSalary: 5500, bonuses: 750, deductions: 275, netSalary: 5975, status: 'APPROVED' },
  { id: '5', employee: 'Maria Santos', period: 'Mar 2026', baseSalary: 3800, bonuses: 0, deductions: 0, netSalary: 3800, status: 'CANCELLED' },
];

const statusVariant: Record<PayrollStatus, 'success' | 'accent' | 'default' | 'danger'> = {
  PAID: 'success',
  APPROVED: 'accent',
  DRAFT: 'default',
  CANCELLED: 'danger',
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function PayrollPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | 'ALL'>('ALL');

  const filtered = statusFilter === 'ALL' ? mockPayroll : mockPayroll.filter((p) => p.status === statusFilter);
  const totalNet = filtered.reduce((sum, p) => sum + p.netSalary, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20, width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {t('payroll.title')}
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {t('payroll.subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm">
            {t('payroll.export')}
          </Button>
          <Button variant="primary" size="sm"
            leftIcon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 5v14M5 12h14" />
              </svg>
            }
          >
            {t('payroll.create')}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: t('payroll.stats.totalNet'), value: formatCurrency(totalNet), accent: 'var(--color-accent)' },
          { label: t('payroll.stats.paid'), value: String(mockPayroll.filter((p) => p.status === 'PAID').length), accent: 'var(--color-success)' },
          { label: t('payroll.stats.pending'), value: String(mockPayroll.filter((p) => p.status === 'APPROVED').length), accent: 'var(--color-warning)' },
          { label: t('payroll.stats.drafts'), value: String(mockPayroll.filter((p) => p.status === 'DRAFT').length), accent: 'var(--color-gray-400)' },
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
            {s}
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
                      {entry.period}
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
                      {entry.employee}
                    </p>
                  </div>
                  <Badge variant={statusVariant[entry.status]} dot>{entry.status}</Badge>
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
                    {formatCurrency(entry.netSalary)}
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    {t('payroll.col.base')}: <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(entry.baseSalary)}</span>
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 'var(--text-sm)',
                      color: entry.bonuses > 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
                    }}
                  >
                    {t('payroll.col.bonuses')}: {entry.bonuses > 0 ? '+' : ''}{formatCurrency(entry.bonuses)}
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-danger)' }}>
                    {t('payroll.col.deductions')}: -{formatCurrency(entry.deductions)}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                  {entry.status === 'DRAFT' && (
                    <Button variant="secondary" style={{ width: '100%', minHeight: 44 }}>
                      {t('payroll.action.approve')}
                    </Button>
                  )}
                  {entry.status === 'APPROVED' && (
                    <Button variant="primary" style={{ width: '100%', minHeight: 44 }}>
                      {t('payroll.action.pay')}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: '100%' }}>
          <div
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                {[t('payroll.col.employee'), t('payroll.col.period'), t('payroll.col.base'), t('payroll.col.bonuses'), t('payroll.col.deductions'), t('payroll.col.net'), t('payroll.col.status'), ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 16px',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      textAlign: 'left',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr
                  key={entry.id}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--color-bg-subtle)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={entry.employee} size="xs" />
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {entry.employee}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                      {entry.period}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(entry.baseSalary)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: entry.bonuses > 0 ? 'var(--color-success)' : 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {entry.bonuses > 0 ? '+' : ''}{formatCurrency(entry.bonuses)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>
                      -{formatCurrency(entry.deductions)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(entry.netSalary)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge variant={statusVariant[entry.status]} dot>{entry.status}</Badge>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {entry.status === 'DRAFT' && (
                      <Button variant="secondary" size="sm">
                        {t('payroll.action.approve')}
                      </Button>
                    )}
                    {entry.status === 'APPROVED' && (
                      <Button variant="primary" size="sm">
                        {t('payroll.action.pay')}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
