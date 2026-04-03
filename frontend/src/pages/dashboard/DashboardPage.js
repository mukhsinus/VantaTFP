import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, Badge, Avatar } from '@shared/components/ui';
function StatCard({ label, value, delta, icon, accent = 'var(--color-accent)' }) {
    return (_jsx(Card, { children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }, children: [_jsxs("div", { children: [_jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 6 }, children: label }), _jsx("p", { style: { fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }, children: value }), delta && (_jsxs("p", { style: {
                                fontSize: 'var(--text-xs)',
                                color: delta.positive ? 'var(--color-success)' : 'var(--color-danger)',
                                marginTop: 6,
                                fontWeight: 500,
                            }, children: [delta.positive ? '↑' : '↓', " ", delta.value] }))] }), _jsx("div", { style: {
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--radius-lg)',
                        background: accent + '18',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: accent,
                        flexShrink: 0,
                    }, children: icon })] }) }));
}
const mockActivity = [
    { id: '1', user: 'Sofia Chen', action: 'completed task', target: 'Q1 Report Draft', time: '2m ago', type: 'success' },
    { id: '2', user: 'James Park', action: 'created task', target: 'Client Onboarding Flow', time: '15m ago', type: 'accent' },
    { id: '3', user: 'Amara Diallo', action: 'task is overdue', target: 'Invoice Processing', time: '1h ago', type: 'danger' },
    { id: '4', user: 'Luca Ferrari', action: 'updated KPI', target: 'Monthly Sales Target', time: '2h ago', type: 'warning' },
    { id: '5', user: 'Maria Santos', action: 'completed task', target: 'Team Review Meeting', time: '3h ago', type: 'success' },
];
const typeToVariant = {
    success: 'success',
    accent: 'accent',
    danger: 'danger',
    warning: 'warning',
};
export function DashboardPage() {
    const { t } = useTranslation();
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 24 }, children: [_jsxs("div", { children: [_jsx("h2", { style: { fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }, children: t('dashboard.title') }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }, children: t('dashboard.subtitle') })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }, children: [_jsx(StatCard, { label: t('dashboard.stats.totalTasks'), value: 48, delta: { value: '12% this week', positive: true }, accent: "var(--color-accent)", icon: _jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, children: [_jsx("path", { d: "M9 11l3 3L22 4" }), _jsx("path", { d: "M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" })] }) }), _jsx(StatCard, { label: t('dashboard.stats.completed'), value: 31, delta: { value: '8% this week', positive: true }, accent: "var(--color-success)", icon: _jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M9 12l2 2 4-4" })] }) }), _jsx(StatCard, { label: t('dashboard.stats.overdue'), value: 5, delta: { value: '2 since yesterday', positive: false }, accent: "var(--color-danger)", icon: _jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M12 8v4M12 16h.01" })] }) }), _jsx(StatCard, { label: t('dashboard.stats.inProgress'), value: 12, accent: "var(--color-warning)", icon: _jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("polyline", { points: "12 6 12 12 16 14" })] }) })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }, children: [_jsxs(Card, { children: [_jsx(CardHeader, { title: t('dashboard.activity.title'), subtitle: t('dashboard.activity.subtitle') }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 0 }, children: mockActivity.map((item, index) => (_jsxs("div", { style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '12px 0',
                                        borderBottom: index < mockActivity.length - 1 ? '1px solid var(--color-border)' : 'none',
                                    }, children: [_jsx(Avatar, { name: item.user, size: "sm" }), _jsx("div", { style: { flex: 1, minWidth: 0 }, children: _jsxs("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }, children: [_jsx("strong", { style: { fontWeight: 500 }, children: item.user }), ' ', _jsx("span", { style: { color: 'var(--color-text-secondary)' }, children: item.action }), ' ', _jsx("span", { style: {
                                                            color: 'var(--color-accent)',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            maxWidth: 200,
                                                            display: 'inline-block',
                                                            verticalAlign: 'bottom',
                                                        }, children: item.target })] }) }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }, children: [_jsx(Badge, { variant: typeToVariant[item.type], dot: true, children: item.type }), _jsx("span", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }, children: item.time })] })] }, item.id))) })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 16 }, children: [_jsxs(Card, { children: [_jsx(CardHeader, { title: t('dashboard.overdue.title') }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 10 }, children: ['Invoice Processing', 'Budget Review Q4', 'Team Feedback Session'].map((task) => (_jsxs("div", { style: {
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                padding: '8px 10px',
                                                background: 'var(--color-danger-subtle)',
                                                border: '1px solid var(--color-danger-border)',
                                                borderRadius: 'var(--radius)',
                                                cursor: 'pointer',
                                            }, children: [_jsx("span", { style: { color: 'var(--color-danger)', flexShrink: 0 }, children: _jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M12 8v4M12 16h.01" })] }) }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-danger)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: task })] }, task))) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { title: t('dashboard.progress.title') }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 14 }, children: [
                                            { label: 'Completed', value: 31, total: 48, color: 'var(--color-success)' },
                                            { label: 'In Progress', value: 12, total: 48, color: 'var(--color-warning)' },
                                            { label: 'Overdue', value: 5, total: 48, color: 'var(--color-danger)' },
                                        ].map((item) => (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 5 }, children: [_jsx("span", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }, children: item.label }), _jsxs("span", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }, children: [item.value, "/", item.total] })] }), _jsx("div", { style: {
                                                        height: 6,
                                                        borderRadius: 'var(--radius-full)',
                                                        background: 'var(--color-bg-muted)',
                                                        overflow: 'hidden',
                                                    }, children: _jsx("div", { style: {
                                                            height: '100%',
                                                            width: `${(item.value / item.total) * 100}%`,
                                                            background: item.color,
                                                            borderRadius: 'var(--radius-full)',
                                                            transition: 'width 0.8s ease',
                                                        } }) })] }, item.label))) })] })] })] })] }));
}
