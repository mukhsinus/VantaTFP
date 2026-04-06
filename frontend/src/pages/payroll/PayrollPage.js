import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Avatar, Card, EmptyState } from '@shared/components/ui';
import { useIsMobile } from '@shared/hooks/useIsMobile';
const mockPayroll = [
    { id: '1', employeeKey: 'booking.payroll.sample.users.sofiaChen', periodKey: 'booking.payroll.sample.periods.mar2026', baseSalary: 6000, bonuses: 500, deductions: 300, netSalary: 6200, status: 'PAID' },
    { id: '2', employeeKey: 'booking.payroll.sample.users.jamesPark', periodKey: 'booking.payroll.sample.periods.mar2026', baseSalary: 4500, bonuses: 200, deductions: 225, netSalary: 4475, status: 'APPROVED' },
    { id: '3', employeeKey: 'booking.payroll.sample.users.amaraDiallo', periodKey: 'booking.payroll.sample.periods.mar2026', baseSalary: 4200, bonuses: 0, deductions: 210, netSalary: 3990, status: 'DRAFT' },
    { id: '4', employeeKey: 'booking.payroll.sample.users.lucaFerrari', periodKey: 'booking.payroll.sample.periods.mar2026', baseSalary: 5500, bonuses: 750, deductions: 275, netSalary: 5975, status: 'APPROVED' },
    { id: '5', employeeKey: 'booking.payroll.sample.users.mariaSantos', periodKey: 'booking.payroll.sample.periods.mar2026', baseSalary: 3800, bonuses: 0, deductions: 0, netSalary: 3800, status: 'CANCELLED' },
];
const statusVariant = {
    PAID: 'success',
    APPROVED: 'accent',
    DRAFT: 'default',
    CANCELLED: 'danger',
};
function formatCurrency(n) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}
export function PayrollPage() {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
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
    const filtered = statusFilter === 'ALL' ? mockPayroll : mockPayroll.filter((p) => p.status === statusFilter);
    const totalNet = filtered.reduce((sum, p) => sum + p.netSalary, 0);
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20, width: '100%', maxWidth: '100%' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 10 }, children: [_jsxs("div", { children: [_jsx("h2", { style: { fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }, children: t('payroll.title') }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }, children: t('payroll.subtitle') })] }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx(Button, { variant: "secondary", size: "sm", children: t('common.export') }), _jsx(Button, { variant: "primary", size: "sm", leftIcon: _jsx("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, children: _jsx("path", { d: "M12 5v14M5 12h14" }) }), children: t('payroll.create') })] })] }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12 }, children: [
                    { label: t('payroll.stats.totalNet'), value: formatCurrency(totalNet), accent: 'var(--color-accent)' },
                    { label: t('payroll.stats.paid'), value: String(mockPayroll.filter((p) => p.status === 'PAID').length), accent: 'var(--color-success)' },
                    { label: t('payroll.stats.pending'), value: String(mockPayroll.filter((p) => p.status === 'APPROVED').length), accent: 'var(--color-warning)' },
                    { label: t('payroll.stats.drafts'), value: String(mockPayroll.filter((p) => p.status === 'DRAFT').length), accent: 'var(--color-gray-400)' },
                ].map((s) => (_jsxs(Card, { children: [_jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 6 }, children: s.label }), _jsx("p", { style: { fontSize: 'var(--text-2xl)', fontWeight: 700, color: s.accent }, children: s.value })] }, s.label))) }), _jsx("div", { style: {
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
                                                }, children: t(entry.periodKey) }), _jsx("p", { style: {
                                                    margin: '4px 0 0',
                                                    fontSize: 'var(--text-base)',
                                                    fontWeight: 600,
                                                    color: 'var(--color-text-primary)',
                                                    wordBreak: 'break-word',
                                                }, children: t(entry.employeeKey) })] }), _jsx(Badge, { variant: statusVariant[entry.status], dot: true, children: statusLabel(entry.status) })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 6 }, children: [_jsx("p", { style: {
                                            margin: 0,
                                            fontSize: 'var(--text-3xl)',
                                            fontWeight: 700,
                                            lineHeight: 1.1,
                                            color: 'var(--color-text-primary)',
                                            fontFamily: 'var(--font-mono)',
                                        }, children: formatCurrency(entry.netSalary) }), _jsxs("p", { style: { margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }, children: [t('payroll.table.baseSalary'), ": ", _jsx("span", { style: { fontFamily: 'var(--font-mono)' }, children: formatCurrency(entry.baseSalary) })] }), _jsxs("p", { style: {
                                            margin: 0,
                                            fontSize: 'var(--text-sm)',
                                            color: entry.bonuses > 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
                                        }, children: [t('payroll.table.bonuses'), ": ", entry.bonuses > 0 ? '+' : '', formatCurrency(entry.bonuses)] }), _jsxs("p", { style: { margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-danger)' }, children: [t('payroll.table.deductions'), ": -", formatCurrency(entry.deductions)] })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }, children: [entry.status === 'DRAFT' && (_jsx(Button, { variant: "secondary", style: { width: '100%', minHeight: 44 }, children: t('payroll.action.approve') })), entry.status === 'APPROVED' && (_jsx(Button, { variant: "primary", style: { width: '100%', minHeight: 44 }, children: t('payroll.action.pay') }))] })] }) }, entry.id))) })) : (_jsx("div", { style: { width: '100%', maxWidth: '100%' }, children: _jsx("div", { style: {
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                    }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsx("tr", { style: { background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)' }, children: [t('payroll.table.employee'), t('payroll.table.period'), t('payroll.table.baseSalary'), t('payroll.table.bonuses'), t('payroll.table.deductions'), t('payroll.table.net'), t('payroll.table.status'), ''].map((h) => (_jsx("th", { style: {
                                            padding: '10px 16px',
                                            fontSize: 'var(--text-xs)',
                                            fontWeight: 600,
                                            color: 'var(--color-text-secondary)',
                                            textAlign: 'left',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.04em',
                                            whiteSpace: 'nowrap',
                                        }, children: h }, h))) }) }), _jsx("tbody", { children: filtered.map((entry) => (_jsxs("tr", { style: {
                                        borderBottom: '1px solid var(--color-border)',
                                        transition: 'background var(--transition-fast)',
                                    }, onMouseEnter: (e) => (e.currentTarget.style.background = 'var(--color-bg-subtle)'), onMouseLeave: (e) => (e.currentTarget.style.background = 'transparent'), children: [_jsx("td", { style: { padding: '12px 16px' }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(Avatar, { name: t(entry.employeeKey), size: "xs" }), _jsx("span", { style: { fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }, children: t(entry.employeeKey) })] }) }), _jsx("td", { style: { padding: '12px 16px' }, children: _jsx("span", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }, children: t(entry.periodKey) }) }), _jsx("td", { style: { padding: '12px 16px' }, children: _jsx("span", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }, children: formatCurrency(entry.baseSalary) }) }), _jsx("td", { style: { padding: '12px 16px' }, children: _jsxs("span", { style: { fontSize: 'var(--text-sm)', color: entry.bonuses > 0 ? 'var(--color-success)' : 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }, children: [entry.bonuses > 0 ? '+' : '', formatCurrency(entry.bonuses)] }) }), _jsx("td", { style: { padding: '12px 16px' }, children: _jsxs("span", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }, children: ["-", formatCurrency(entry.deductions)] }) }), _jsx("td", { style: { padding: '12px 16px' }, children: _jsx("span", { style: { fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }, children: formatCurrency(entry.netSalary) }) }), _jsx("td", { style: { padding: '12px 16px' }, children: _jsx(Badge, { variant: statusVariant[entry.status], dot: true, children: statusLabel(entry.status) }) }), _jsxs("td", { style: { padding: '12px 16px' }, children: [entry.status === 'DRAFT' && (_jsx(Button, { variant: "secondary", size: "sm", children: t('payroll.action.approve') })), entry.status === 'APPROVED' && (_jsx(Button, { variant: "primary", size: "sm", children: t('payroll.action.pay') }))] })] }, entry.id))) })] }) }) }))] }));
}
