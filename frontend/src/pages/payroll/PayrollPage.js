import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Avatar, Card, EmptyState, PageSkeleton } from '@shared/components/ui';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { formatCurrency } from '@shared/utils/currency';
import { usePayroll } from '@features/payroll/hooks/usePayroll';
import { useApprovePayroll } from '@features/payroll/hooks/useApprovePayroll';
import { PayrollRulesPanel } from '@features/payroll/components/PayrollRulesPanel';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
const statusVariant = {
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
    const locale = localeBase === 'ru' || localeBase === 'uz' || localeBase === 'en' ? localeBase : 'en';
    const [statusFilter, setStatusFilter] = useState('ALL');
    const statusLabel = (status) => {
        if (status === 'ALL')
            return t('common.all');
        if (status === 'DRAFT')
            return t('status.draft');
        if (status === 'APPROVED')
            return t('status.approved');
        if (status === 'PAID')
            return t('status.paid');
        return t('status.cancelled');
    };
    const filtered = statusFilter === 'ALL' ? payroll : payroll.filter((p) => p.status === statusFilter);
    const totalNet = filtered.reduce((sum, p) => sum + p.netSalary, 0);
    if (isLoading)
        return _jsx(PageSkeleton, {});
    if (isError) {
        return (_jsx(EmptyState, { title: t('errors.loadFailed.title'), description: t('errors.loadFailed.description') }));
    }
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20, width: '100%', maxWidth: '100%' }, children: [_jsx("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 10 }, children: _jsxs("div", { children: [_jsx("h2", { style: { fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }, children: title }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }, children: subtitle })] }) }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12 }, children: [
                    { label: t('payroll.stats.totalNet'), value: formatCurrency(totalNet, locale), accent: 'var(--color-accent)' },
                    { label: t('payroll.stats.paid'), value: String(payroll.filter((p) => p.status === 'PAID').length), accent: 'var(--color-success)' },
                    { label: t('payroll.stats.pending'), value: String(payroll.filter((p) => p.status === 'APPROVED').length), accent: 'var(--color-warning)' },
                    { label: t('payroll.stats.drafts'), value: String(payroll.filter((p) => p.status === 'DRAFT').length), accent: 'var(--color-gray-400)' },
                ].map((s) => (_jsxs(Card, { children: [_jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 6 }, children: s.label }), _jsx("p", { style: { fontSize: 'var(--text-2xl)', fontWeight: 700, color: s.accent }, children: s.value })] }, s.label))) }), isAdmin && _jsx(PayrollRulesPanel, {}), _jsx("div", { style: {
                    width: '100%',
                    maxWidth: '100%',
                    overflowX: isMobile ? 'auto' : 'visible',
                    overflowY: 'hidden',
                    boxSizing: 'border-box',
                    paddingBottom: isMobile ? 2 : 0,
                }, children: _jsx("div", { style: { display: 'flex', gap: 6, flexWrap: 'nowrap', width: 'max-content', minWidth: '100%' }, children: ['ALL', 'DRAFT', 'APPROVED', 'PAID', 'CANCELLED'].map((s) => (_jsx("button", { onClick: () => setStatusFilter(s), style: {
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
                        }, children: statusLabel(s) }, s))) }) }), filtered.length === 0 ? (_jsx(EmptyState, { title: t('payroll.empty.title'), description: t('payroll.empty.description') })) : isMobile ? (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: '100%' }, children: filtered.map((entry) => (_jsx(Card, { children: _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: '100%' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }, children: [_jsxs("div", { style: { minWidth: 0 }, children: [_jsx("p", { style: {
                                                    margin: 0,
                                                    fontSize: 'var(--text-sm)',
                                                    color: 'var(--color-text-secondary)',
                                                }, children: formatPeriod(entry.periodStart, entry.periodEnd, locale) }), _jsx("p", { style: {
                                                    margin: '4px 0 0',
                                                    fontSize: 'var(--text-base)',
                                                    fontWeight: 600,
                                                    color: 'var(--color-text-primary)',
                                                    wordBreak: 'break-word',
                                                }, children: entry.employeeId })] }), _jsx(Badge, { variant: statusVariant[entry.status], dot: true, children: statusLabel(entry.status) })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 6 }, children: [_jsx("p", { style: {
                                            margin: 0,
                                            fontSize: 'var(--text-3xl)',
                                            fontWeight: 700,
                                            lineHeight: 1.1,
                                            color: 'var(--color-text-primary)',
                                            fontFamily: 'var(--font-mono)',
                                        }, children: formatCurrency(entry.netSalary, locale) }), _jsxs("p", { style: { margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }, children: [t('payroll.table.baseSalary'), ": ", _jsx("span", { style: { fontFamily: 'var(--font-mono)' }, children: formatCurrency(entry.baseSalary, locale) })] }), _jsxs("p", { style: {
                                            margin: 0,
                                            fontSize: 'var(--text-sm)',
                                            color: entry.bonuses > 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
                                        }, children: [t('payroll.table.bonuses'), ": ", entry.bonuses > 0 ? '+' : '', formatCurrency(entry.bonuses, locale)] }), _jsxs("p", { style: { margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-danger)' }, children: [t('payroll.table.deductions'), ": -", formatCurrency(entry.deductions, locale)] })] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }, children: isAdmin && entry.status === 'DRAFT' && (_jsx(Button, { variant: "secondary", style: { width: '100%', minHeight: 44 }, onClick: () => approvePayroll(entry.id), disabled: isPending, children: t('payroll.action.approve') })) })] }) }, entry.id))) })) : (_jsx("div", { className: "responsive-grid", style: { gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }, children: filtered.map((entry) => (_jsx(Card, { children: _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 12 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }, children: [_jsx(Avatar, { name: entry.employeeId, size: "xs" }), _jsx("span", { style: { fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }, children: entry.employeeId })] }), _jsx(Badge, { variant: statusVariant[entry.status], dot: true, children: statusLabel(entry.status) })] }), _jsx("p", { style: { margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }, children: formatPeriod(entry.periodStart, entry.periodEnd, locale) }), _jsx("p", { style: { margin: 0, fontSize: 'var(--text-xl)', fontWeight: 700, fontFamily: 'var(--font-mono)' }, children: formatCurrency(entry.netSalary, locale) }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }, children: [_jsxs("p", { style: { margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }, children: [t('payroll.table.baseSalary'), ": ", formatCurrency(entry.baseSalary, locale)] }), _jsxs("p", { style: { margin: 0, fontSize: 'var(--text-sm)', color: entry.bonuses > 0 ? 'var(--color-success)' : 'var(--color-text-secondary)' }, children: [t('payroll.table.bonuses'), ": ", entry.bonuses > 0 ? '+' : '', formatCurrency(entry.bonuses, locale)] }), _jsxs("p", { style: { margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-danger)' }, children: [t('payroll.table.deductions'), ": -", formatCurrency(entry.deductions, locale)] })] }), isAdmin && entry.status === 'DRAFT' && (_jsx(Button, { variant: "secondary", size: "sm", onClick: () => approvePayroll(entry.id), disabled: isPending, loading: isPending, children: t('payroll.action.approve') }))] }) }, entry.id))) }))] }));
}
function formatPeriod(periodStart, periodEnd, locale) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return `${periodStart} - ${periodEnd}`;
    }
    return `${start.toLocaleDateString(locale)} - ${end.toLocaleDateString(locale)}`;
}
