import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Card, CardHeader, Badge, Skeleton } from '@shared/components/ui';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { useTasks } from '@features/tasks/hooks/useTasks';
import { usePayroll } from '@features/payroll/hooks/usePayroll';
import { useReportHistory } from '@features/reports/hooks/useReports';
import { useKpiAnalytics } from '@features/kpi/hooks/useKpiAnalytics';
function StatCard({ label, value, accent = 'var(--color-accent)' }) {
    return (_jsxs(Card, { children: [_jsx("p", { style: { margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }, children: label }), _jsx("p", { style: { margin: '6px 0 0', fontSize: 'var(--text-2xl)', fontWeight: 700, color: accent }, children: value })] }));
}
export function DashboardPage() {
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
        return _jsx(Skeleton, { height: 260, borderRadius: "var(--radius-lg)" });
    }
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === 'DONE').length;
    const overdueTasks = tasks.filter((task) => task.overdue).length;
    const inProgressTasks = tasks.filter((task) => task.status === 'IN_PROGRESS' || task.status === 'IN_REVIEW').length;
    const payrollTotal = payroll.reduce((sum, item) => sum + item.netSalary, 0);
    const performance = aggregated.data?.performancePercent ?? 0;
    const title = role === 'MANAGER' ? 'Team Dashboard' : role === 'EMPLOYEE' ? 'My Dashboard' : 'Dashboard';
    return (_jsxs("div", { className: "page-container", style: { display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 20 }, children: [_jsxs("div", { children: [_jsx("h2", { style: { margin: 0, fontSize: 'var(--text-2xl)' }, children: title }), _jsx("p", { style: { margin: '6px 0 0', color: 'var(--color-text-secondary)' }, children: "Live tenant data synchronized from backend services." })] }), _jsxs("div", { className: "responsive-grid", style: { gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, minmax(180px, 1fr))' }, children: [_jsx(StatCard, { label: "Total Tasks", value: totalTasks }), _jsx(StatCard, { label: "Completed Tasks", value: completedTasks, accent: "var(--color-success)" }), _jsx(StatCard, { label: "Overdue Tasks", value: overdueTasks, accent: "var(--color-danger)" }), _jsx(StatCard, { label: "In Progress", value: inProgressTasks, accent: "var(--color-warning)" })] }), _jsxs("div", { className: "responsive-grid", style: { gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(260px, 1fr))' }, children: [_jsxs(Card, { children: [_jsx(CardHeader, { title: "KPI Summary", subtitle: "From KPI analytics endpoint" }), _jsxs("p", { style: { margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 700 }, children: [performance.toFixed(2), "%"] }), _jsxs("p", { style: { marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }, children: ["Assignees: ", aggregated.data?.assigneeCount ?? 0, " \u00B7 Completed: ", aggregated.data?.completedTasks ?? 0] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { title: "Payroll Summary", subtitle: "From payroll entries endpoint" }), _jsx("p", { style: { margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 700 }, children: payrollTotal.toLocaleString() }), _jsxs("p", { style: { marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }, children: ["Entries: ", payroll.length] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { title: "Recent Tasks", subtitle: "Latest synced tasks" }), tasks.slice(0, 5).map((task) => (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--color-border)' }, children: [_jsxs("div", { style: { minWidth: 0 }, children: [_jsx("p", { style: { margin: 0, fontWeight: 600 }, children: task.title }), _jsx("p", { style: { margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }, children: task.assignee })] }), _jsx(Badge, { variant: task.overdue ? 'danger' : 'default', children: task.status })] }, task.id)))] }), _jsxs(Card, { children: [_jsx(CardHeader, { title: "Reports Activity", subtitle: "From report history endpoint" }), _jsxs("p", { style: { margin: 0, fontSize: 'var(--text-sm)' }, children: ["Generated reports: ", history?.data?.length ?? 0] })] })] }));
}
