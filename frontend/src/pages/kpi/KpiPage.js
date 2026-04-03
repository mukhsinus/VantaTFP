import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Avatar, Card } from '@shared/components/ui';
const mockKpis = [
    { id: '1', name: 'Sales Closed', assignee: 'Luca Ferrari', targetValue: 20, actualValue: 17, unit: 'deals', period: 'MONTHLY', trend: 'up' },
    { id: '2', name: 'Customer Satisfaction', assignee: 'Sofia Chen', targetValue: 90, actualValue: 86, unit: '%', period: 'MONTHLY', trend: 'stable' },
    { id: '3', name: 'Tasks Completed', assignee: 'Amara Diallo', targetValue: 50, actualValue: 31, unit: 'tasks', period: 'MONTHLY', trend: 'up' },
    { id: '4', name: 'Response Time', assignee: 'James Park', targetValue: 2, actualValue: 3.2, unit: 'hrs', period: 'WEEKLY', trend: 'down' },
    { id: '5', name: 'Revenue Target', assignee: 'Maria Santos', targetValue: 100000, actualValue: 78000, unit: '$', period: 'QUARTERLY', trend: 'up' },
];
function getProgress(actual, target) {
    return Math.min(100, Math.round((actual / target) * 100));
}
function progressColor(pct) {
    if (pct >= 90)
        return 'var(--color-success)';
    if (pct >= 60)
        return 'var(--color-warning)';
    return 'var(--color-danger)';
}
export function KpiPage() {
    const { t } = useTranslation();
    const [period, setPeriod] = useState('ALL');
    const filtered = period === 'ALL' ? mockKpis : mockKpis.filter((k) => k.period === period);
    const avgProgress = Math.round(filtered.reduce((sum, k) => sum + getProgress(k.actualValue, k.targetValue), 0) / (filtered.length || 1));
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 20 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsx("h2", { style: { fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }, children: t('kpi.title') }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }, children: t('kpi.subtitle') })] }), _jsx(Button, { variant: "primary", size: "sm", leftIcon: _jsx("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, children: _jsx("path", { d: "M12 5v14M5 12h14" }) }), children: t('kpi.create') })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("div", { style: { display: 'flex', gap: 6 }, children: ['ALL', 'WEEKLY', 'MONTHLY', 'QUARTERLY'].map((p) => (_jsx("button", { onClick: () => setPeriod(p), style: {
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
                            }, children: p }, p))) }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("span", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }, children: t('kpi.avgProgress') }), _jsxs("span", { style: {
                                    fontSize: 'var(--text-lg)',
                                    fontWeight: 700,
                                    color: progressColor(avgProgress),
                                }, children: [avgProgress, "%"] })] })] }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }, children: filtered.map((kpi) => _jsx(KpiCard, { kpi: kpi }, kpi.id)) })] }));
}
const trendIcon = {
    up: (_jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-success)", strokeWidth: 2.5, children: [_jsx("polyline", { points: "23 6 13.5 15.5 8.5 10.5 1 18" }), _jsx("polyline", { points: "17 6 23 6 23 12" })] })),
    down: (_jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-danger)", strokeWidth: 2.5, children: [_jsx("polyline", { points: "23 18 13.5 8.5 8.5 13.5 1 6" }), _jsx("polyline", { points: "17 18 23 18 23 12" })] })),
    stable: (_jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-warning)", strokeWidth: 2.5, children: _jsx("path", { d: "M5 12h14" }) })),
};
function KpiCard({ kpi }) {
    const pct = getProgress(kpi.actualValue, kpi.targetValue);
    const color = progressColor(pct);
    return (_jsxs(Card, { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }, children: [_jsxs("div", { children: [_jsx("p", { style: { fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)' }, children: kpi.name }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }, children: [_jsx(Avatar, { name: kpi.assignee, size: "xs" }), _jsx("span", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }, children: kpi.assignee })] })] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [trendIcon[kpi.trend], _jsx(Badge, { variant: "default", style: { fontSize: 10 }, children: kpi.period })] }) })] }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 }, children: [_jsx("span", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }, children: "Progress" }), _jsxs("span", { style: { fontSize: 'var(--text-xs)', fontWeight: 700, color }, children: [pct, "%"] })] }), _jsx("div", { style: {
                            height: 8,
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--color-bg-muted)',
                            overflow: 'hidden',
                        }, children: _jsx("div", { style: {
                                height: '100%',
                                width: `${pct}%`,
                                background: color,
                                borderRadius: 'var(--radius-full)',
                                transition: 'width 0.8s ease',
                            } }) })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between' }, children: [_jsxs("div", { children: [_jsx("p", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }, children: "Actual" }), _jsxs("p", { style: { fontSize: 'var(--text-lg)', fontWeight: 700, color }, children: [kpi.actualValue.toLocaleString(), " ", _jsx("span", { style: { fontSize: 'var(--text-xs)', fontWeight: 400 }, children: kpi.unit })] })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsx("p", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }, children: "Target" }), _jsxs("p", { style: { fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-secondary)' }, children: [kpi.targetValue.toLocaleString(), " ", _jsx("span", { style: { fontSize: 'var(--text-xs)', fontWeight: 400 }, children: kpi.unit })] })] })] })] }));
}
