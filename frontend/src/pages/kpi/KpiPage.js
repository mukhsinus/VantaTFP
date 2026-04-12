import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Card, EmptyState, PageSkeleton } from '@shared/components/ui';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useKpis } from '@features/kpi/hooks/useKpis';
import { KpiAnalyticsPanel } from '@features/kpi/components/KpiAnalyticsPanel';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
export function KpiPage() {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const { role, user } = useCurrentUser();
    const { kpis, isLoading, isError } = useKpis();
    const [period, setPeriod] = useState('ALL');
    const periodLabel = (value) => {
        if (value === 'ALL')
            return t('kpi.period.all');
        if (value === 'WEEKLY')
            return t('kpi.period.weekly');
        if (value === 'MONTHLY')
            return t('kpi.period.monthly');
        return t('kpi.period.quarterly');
    };
    const filtered = useMemo(() => (period === 'ALL' ? kpis : kpis.filter((kpi) => kpi.period === period)), [period, kpis]);
    const title = role === 'EMPLOYEE' ? 'My KPI' : role === 'MANAGER' ? 'Team KPI' : t('kpi.title');
    const subtitle = role === 'EMPLOYEE'
        ? 'Personal KPI performance for your account.'
        : role === 'MANAGER'
            ? 'Team KPI performance and trend overview.'
            : t('kpi.subtitle');
    if (isLoading)
        return _jsx(PageSkeleton, {});
    if (isError) {
        return (_jsx(EmptyState, { title: t('errors.loadFailed.title'), description: t('errors.loadFailed.description') }));
    }
    return (_jsxs("div", { className: "page-container", style: { display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20, width: '100%', maxWidth: '100%' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 10 : 0 }, children: [_jsxs("div", { children: [_jsx("h2", { style: { fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }, children: title }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }, children: subtitle })] }), _jsx(Badge, { variant: "default", children: filtered.length })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 10 }, children: [_jsx("div", { style: { display: 'flex', gap: 6, flexWrap: 'wrap', width: '100%' }, children: ['ALL', 'WEEKLY', 'MONTHLY', 'QUARTERLY'].map((p) => (_jsx("button", { onClick: () => setPeriod(p), style: {
                                padding: '5px 12px',
                                minHeight: 40,
                                fontSize: 'var(--text-sm)',
                                fontWeight: 500,
                                borderRadius: 'var(--radius-full)',
                                border: '1px solid',
                                cursor: 'pointer',
                                transition: 'all var(--transition)',
                                background: period === p ? 'var(--color-accent)' : 'var(--color-bg)',
                                color: period === p ? '#fff' : 'var(--color-text-secondary)',
                                borderColor: period === p ? 'var(--color-accent)' : 'var(--color-border-strong)',
                            }, children: periodLabel(p) }, p))) }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }, children: t('kpi.subtitle') })] }), _jsx(KpiAnalyticsPanel, { role: role, userId: user?.userId }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }, children: filtered.length === 0 ? (_jsx(EmptyState, { title: t('kpi.title'), description: t('kpi.subtitle') })) : (filtered.map((kpi) => _jsx(KpiCard, { kpi: kpi }, kpi.id))) })] }));
}
function KpiCard({ kpi }) {
    const { t } = useTranslation();
    return (_jsxs(Card, { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }, children: [_jsxs("div", { children: [_jsx("p", { style: { fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)' }, children: kpi.name }), _jsx("p", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 4 }, children: kpi.description ?? '-' })] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }, children: _jsx(Badge, { variant: "default", style: { fontSize: 10 }, children: kpi.period === 'WEEKLY'
                                ? t('kpi.period.weekly')
                                : kpi.period === 'MONTHLY'
                                    ? t('kpi.period.monthly')
                                    : kpi.period === 'QUARTERLY'
                                        ? t('kpi.period.quarterly')
                                        : 'Yearly' }) })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between' }, children: [_jsxs("div", { children: [_jsx("p", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }, children: t('kpi.target') }), _jsxs("p", { style: { fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }, children: [kpi.targetValue.toLocaleString(), " ", _jsx("span", { style: { fontSize: 'var(--text-xs)', fontWeight: 400 }, children: kpi.unit })] })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsx("p", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }, children: "Assignee" }), _jsx("p", { style: { fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }, children: kpi.assigneeId })] })] })] }));
}
