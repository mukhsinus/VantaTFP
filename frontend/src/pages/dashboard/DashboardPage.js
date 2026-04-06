import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, Badge, Avatar } from '@shared/components/ui';
import { useIsMobile } from '@shared/hooks/useIsMobile';
function StatCard({ label, value, delta, icon, accent = 'var(--color-accent)', compact = false }) {
    return (_jsx(Card, { padding: compact ? 'sm' : 'md', children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }, children: [_jsxs("div", { style: { minWidth: 0 }, children: [_jsx("p", { style: {
                                fontSize: compact ? '11px' : 'var(--text-sm)',
                                color: 'var(--color-text-secondary)',
                                marginBottom: compact ? 4 : 6,
                                lineHeight: 1.25,
                            }, children: label }), _jsx("p", { style: {
                                fontSize: compact ? 'var(--text-2xl)' : 'var(--text-3xl)',
                                fontWeight: 700,
                                color: 'var(--color-text-primary)',
                                lineHeight: 1,
                            }, children: value }), delta && (_jsxs("p", { style: {
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: compact ? '10px' : 'var(--text-xs)',
                                color: delta.positive ? 'var(--color-success)' : 'var(--color-danger)',
                                marginTop: compact ? 4 : 6,
                                fontWeight: 500,
                                lineHeight: 1.2,
                            }, children: [delta.positive ? '↑' : '↓', " ", delta.value] }))] }), _jsx("div", { style: {
                        width: compact ? 32 : 40,
                        height: compact ? 32 : 40,
                        borderRadius: compact ? 'var(--radius)' : 'var(--radius-lg)',
                        background: accent + '18',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: accent,
                        flexShrink: 0,
                    }, children: icon })] }) }));
}
const typeToVariant = {
    success: 'success',
    accent: 'accent',
    danger: 'danger',
    warning: 'warning',
};
export function DashboardPage() {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const mockActivity = [
        { id: '1', userKey: 'overview.sample.users.sofiaChen', taskKey: 'overview.sample.tasks.q1ReportDraft', actionKey: 'completedTask', time: t('time.minutesAgo', { count: 2 }), type: 'success' },
        { id: '2', userKey: 'overview.sample.users.jamesPark', taskKey: 'overview.sample.tasks.clientOnboardingFlow', actionKey: 'createdTask', time: t('time.minutesAgo', { count: 15 }), type: 'accent' },
        { id: '3', userKey: 'overview.sample.users.amaraDiallo', taskKey: 'overview.sample.tasks.invoiceProcessing', actionKey: 'overdueTask', time: t('time.hoursAgo', { count: 1 }), type: 'danger' },
        { id: '4', userKey: 'overview.sample.users.lucaFerrari', taskKey: 'overview.sample.tasks.monthlySalesTarget', actionKey: 'updatedKpi', time: t('time.hoursAgo', { count: 2 }), type: 'warning' },
        { id: '5', userKey: 'overview.sample.users.mariaSantos', taskKey: 'overview.sample.tasks.teamReviewMeeting', actionKey: 'completedTask', time: t('time.hoursAgo', { count: 3 }), type: 'success' },
    ];
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 24, width: '100%', maxWidth: '100%' }, children: [isMobile ? (_jsx("div", { children: _jsx("p", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }, children: t('overview.subtitle') }) })) : (_jsxs("div", { children: [_jsx("h2", { style: { fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }, children: t('overview.title') }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }, children: t('overview.subtitle') })] })), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: isMobile ? 8 : 12 }, children: [_jsx(StatCard, { label: t('overview.stats.totalTasks'), value: 48, delta: { value: t('overview.stats.delta.totalTasksWeek'), positive: true }, accent: "var(--color-accent)", compact: isMobile, icon: _jsxs("svg", { width: isMobile ? '16' : '18', height: isMobile ? '16' : '18', viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, children: [_jsx("path", { d: "M9 11l3 3L22 4" }), _jsx("path", { d: "M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" })] }) }), _jsx(StatCard, { label: t('overview.stats.completed'), value: 31, delta: { value: t('overview.stats.delta.completedWeek'), positive: true }, accent: "var(--color-success)", compact: isMobile, icon: _jsxs("svg", { width: isMobile ? '16' : '18', height: isMobile ? '16' : '18', viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M9 12l2 2 4-4" })] }) }), _jsx(StatCard, { label: t('overview.stats.overdue'), value: 5, delta: { value: t('overview.stats.delta.overdueSinceYesterday'), positive: false }, accent: "var(--color-danger)", compact: isMobile, icon: _jsxs("svg", { width: isMobile ? '16' : '18', height: isMobile ? '16' : '18', viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M12 8v4M12 16h.01" })] }) }), _jsx(StatCard, { label: t('overview.stats.inProgress'), value: 12, accent: "var(--color-warning)", compact: isMobile, icon: _jsxs("svg", { width: isMobile ? '16' : '18', height: isMobile ? '16' : '18', viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("polyline", { points: "12 6 12 12 16 14" })] }) })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: 16, width: '100%', maxWidth: '100%' }, children: [_jsxs(Card, { padding: isMobile ? 'sm' : 'md', children: [_jsx(CardHeader, { title: t('overview.activity.title'), subtitle: t('overview.activity.subtitle') }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 0 }, children: mockActivity.map((item, index) => (_jsxs("div", { style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: isMobile ? 8 : 12,
                                        padding: isMobile ? '8px 0' : '12px 0',
                                        borderBottom: index < mockActivity.length - 1 ? '1px solid var(--color-border)' : 'none',
                                    }, children: [_jsx(Avatar, { name: t(item.userKey), size: "sm" }), _jsx("div", { style: { flex: 1, minWidth: 0 }, children: (() => {
                                                const userName = t(item.userKey);
                                                const activity = t(`overview.activity.${item.actionKey}`, {
                                                    user: userName,
                                                    task: t(item.taskKey),
                                                });
                                                const actionText = activity.startsWith(userName)
                                                    ? activity.slice(userName.length).trimStart()
                                                    : activity;
                                                return (_jsxs("p", { style: { fontSize: isMobile ? '13px' : 'var(--text-sm)', color: 'var(--color-text-primary)', lineHeight: 1.4 }, children: [_jsx("strong", { style: { fontWeight: 600 }, children: userName }), ' ', _jsx("span", { style: { color: 'var(--color-text-secondary)' }, children: actionText })] }));
                                            })() }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }, children: [_jsx(Badge, { variant: typeToVariant[item.type], dot: true, style: isMobile
                                                        ? {
                                                            padding: '1px 6px',
                                                            fontSize: '10px',
                                                            lineHeight: 1.4,
                                                            opacity: 0.85,
                                                        }
                                                        : undefined, children: item.type === 'success'
                                                        ? t('status.success')
                                                        : item.type === 'warning'
                                                            ? t('status.warning')
                                                            : item.type === 'danger'
                                                                ? t('status.danger')
                                                                : t('status.accent') }), _jsx("span", { style: { fontSize: isMobile ? '10px' : 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }, children: item.time })] })] }, item.id))) })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 16 }, children: [_jsxs(Card, { padding: isMobile ? 'sm' : 'md', children: [_jsx(CardHeader, { title: t('overview.overdue.title') }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 10 }, children: [
                                            t('overview.overdue.items.invoiceProcessing'),
                                            t('overview.overdue.items.budgetReviewQ4'),
                                            t('overview.overdue.items.teamFeedbackSession'),
                                        ].map((task) => (_jsxs("div", { style: {
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                padding: isMobile ? '8px' : '8px 10px',
                                                background: 'var(--color-danger-subtle)',
                                                border: '1px solid var(--color-danger-border)',
                                                borderRadius: 'var(--radius)',
                                                cursor: 'pointer',
                                            }, children: [_jsx("span", { style: { color: 'var(--color-danger)', flexShrink: 0 }, children: _jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M12 8v4M12 16h.01" })] }) }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-danger)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: task })] }, task))) })] }), _jsxs(Card, { padding: isMobile ? 'sm' : 'md', children: [_jsx(CardHeader, { title: t('overview.progress.title') }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 14 }, children: [
                                            { label: t('overview.stats.completed'), value: 31, total: 48, color: 'var(--color-success)' },
                                            { label: t('overview.stats.inProgress'), value: 12, total: 48, color: 'var(--color-warning)' },
                                            { label: t('overview.stats.overdue'), value: 5, total: 48, color: 'var(--color-danger)' },
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
