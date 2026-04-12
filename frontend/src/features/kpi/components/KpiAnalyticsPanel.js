import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, EmptyState, Skeleton } from '@shared/components/ui';
import { useKpiAnalytics } from '../hooks/useKpiAnalytics';
export function KpiAnalyticsPanel({ role, userId }) {
    const { aggregated, employees } = useKpiAnalytics({ role, userId });
    if (aggregated.isLoading || employees.isLoading) {
        return (_jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 12 }, children: [1, 2, 3, 4].map((x) => (_jsx(Skeleton, { height: 84, borderRadius: "var(--radius-lg)" }, x))) }));
    }
    if (aggregated.isError || employees.isError || !aggregated.data || !employees.data) {
        return (_jsx(EmptyState, { title: "KPI analytics unavailable", description: "Unable to load advanced KPI analytics right now." }));
    }
    return (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 12 }, children: [_jsxs(Card, { children: [_jsx("p", { style: { margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }, children: "Assignees" }), _jsx("p", { style: { margin: '6px 0 0', fontSize: 28, fontWeight: 700 }, children: aggregated.data.assigneeCount })] }), _jsxs(Card, { children: [_jsx("p", { style: { margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }, children: "Completed Tasks" }), _jsx("p", { style: { margin: '6px 0 0', fontSize: 28, fontWeight: 700 }, children: aggregated.data.completedTasks })] }), _jsxs(Card, { children: [_jsx("p", { style: { margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }, children: "Open Overdue" }), _jsx("p", { style: { margin: '6px 0 0', fontSize: 28, fontWeight: 700, color: 'var(--color-danger)' }, children: aggregated.data.openOverdueTasks })] }), _jsxs(Card, { children: [_jsx("p", { style: { margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }, children: "Performance" }), _jsxs("p", { style: { margin: '6px 0 0', fontSize: 28, fontWeight: 700, color: 'var(--color-accent)' }, children: [aggregated.data.performancePercent.toFixed(2), "%"] })] })] }));
}
