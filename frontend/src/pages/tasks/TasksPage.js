import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Avatar, Card, EmptyState, PageSkeleton, Select } from '@shared/components/ui';
import { useTasks } from '@features/tasks/hooks/useTasks';
import { useUpdateTaskStatus } from '@features/tasks/hooks/useUpdateTaskStatus';
import { CreateTaskModal } from '@features/tasks/components/CreateTaskModal';
import { usePermissions } from '@shared/hooks/useCanPerform';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { TASK_STATUS_ALLOWED_NEXT } from '@entities/task/task.transitions';
import { useBilling } from '@features/billing/hooks/useBilling';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_COLUMNS = [
    { id: 'TODO', labelKey: 'status.todo', color: 'var(--color-gray-400)' },
    { id: 'IN_PROGRESS', labelKey: 'status.inProgress', color: 'var(--color-warning)' },
    { id: 'IN_REVIEW', labelKey: 'status.inReview', color: 'var(--color-accent)' },
    { id: 'DONE', labelKey: 'status.done', color: 'var(--color-success)' },
];
const STATUS_SEQUENCE = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITY_VARIANT = {
    CRITICAL: 'danger',
    HIGH: 'warning',
    MEDIUM: 'info',
    LOW: 'default',
};
const PRIORITY_LABEL_KEY = {
    LOW: 'status.low',
    MEDIUM: 'status.medium',
    HIGH: 'status.high',
    CRITICAL: 'status.critical',
};
// ─── Page ─────────────────────────────────────────────────────────────────────
export function TasksPage() {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const [view, setView] = useState('board');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { role } = useCurrentUser();
    const taskTitle = role === 'EMPLOYEE' ? 'My Tasks' : role === 'MANAGER' ? 'Team Tasks' : t('tasks.title');
    const canSwitchView = role !== 'EMPLOYEE';
    const { tasks, total, isLoading, isError, refetch } = useTasks();
    const { data: billing } = useBilling();
    const { can } = usePermissions();
    const overdueTasks = tasks.filter((task) => task.overdue);
    const taskLimitReached = billing &&
        billing.plan !== 'platform' &&
        billing.tasks_limit !== null &&
        billing.tasks_limit !== undefined
        ? total >= billing.tasks_limit
        : false;
    if (isLoading)
        return _jsx(PageSkeleton, {});
    if (isError) {
        return (_jsx(EmptyState, { title: t('errors.loadFailed.title'), description: t('errors.loadFailed.description'), action: { label: t('common.actions.retry'), onClick: () => void refetch() }, icon: _jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M12 8v4M12 16h.01" })] }) }));
    }
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "page-container", style: { display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 10 : 0 }, children: [_jsxs("div", { children: [_jsx("h2", { style: { fontSize: isMobile ? 'var(--text-xl)' : 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }, children: taskTitle }), _jsxs("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }, children: [total, " ", t('tasks.total'), overdueTasks.length > 0 && (_jsxs(_Fragment, { children: [' · ', _jsxs("span", { style: { color: 'var(--color-danger)', fontWeight: 500 }, children: [overdueTasks.length, " ", t('tasks.overdue')] })] }))] })] }), !isMobile && _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10 }, children: [canSwitchView && _jsx("div", { style: {
                                            display: 'flex',
                                            background: 'var(--color-bg-muted)',
                                            borderRadius: 'var(--radius)',
                                            padding: 3,
                                            gap: 2,
                                        }, children: ['board', 'list'].map((v) => (_jsx("button", { onClick: () => setView(v), style: {
                                                padding: '4px 10px',
                                                fontSize: 'var(--text-sm)',
                                                fontWeight: 500,
                                                borderRadius: 'var(--radius-sm)',
                                                border: 'none',
                                                cursor: 'pointer',
                                                transition: 'background var(--transition)',
                                                background: view === v ? 'var(--color-bg)' : 'transparent',
                                                color: view === v ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                                boxShadow: view === v ? 'var(--shadow-xs)' : 'none',
                                            }, children: v === 'board' ? t('tasks.view.board') : t('tasks.view.list') }, v))) }), can('task:create') && (_jsx(Button, { variant: "primary", size: "sm", onClick: () => setShowCreateModal(true), disabled: taskLimitReached, leftIcon: _jsx("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, children: _jsx("path", { d: "M12 5v14M5 12h14" }) }), children: t('tasks.create') }))] })] }), taskLimitReached && (_jsx(Card, { style: { borderColor: 'var(--color-warning-border)', background: 'var(--color-warning-subtle)' }, children: _jsx("p", { style: { margin: 0, color: 'var(--color-warning)', fontSize: 'var(--text-sm)', fontWeight: 600 }, children: t('billing.limitReached', { defaultValue: 'Task limit reached for your current plan.' }) }) })), overdueTasks.length > 0 && (_jsxs("div", { style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 14px',
                            background: 'var(--color-danger-subtle)',
                            border: '1px solid var(--color-danger-border)',
                            borderRadius: 'var(--radius)',
                            fontSize: 'var(--text-sm)',
                        }, children: [_jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-danger)", strokeWidth: 2, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M12 8v4M12 16h.01" })] }), _jsxs("span", { style: { color: 'var(--color-danger)', fontWeight: 500 }, children: [overdueTasks.length, " ", t('tasks.overdueAlert')] })] })), tasks.length === 0 ? (_jsx(EmptyState, { title: t('tasks.empty.title'), description: t('tasks.empty.subtitle'), action: can('task:create')
                            ? { label: t('tasks.create'), onClick: () => setShowCreateModal(true) }
                            : undefined, icon: _jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, children: [_jsx("path", { d: "M9 11l3 3L22 4" }), _jsx("path", { d: "M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" })] }) })) : isMobile || role === 'EMPLOYEE' ? (_jsx(MobileTasksList, { tasks: tasks })) : view === 'board' ? (_jsx(BoardView, { tasks: tasks })) : (_jsx(ListView, { tasks: tasks }))] }), isMobile && can('task:create') && (_jsxs("button", { onClick: () => setShowCreateModal(true), disabled: taskLimitReached, style: {
                    position: 'fixed',
                    left: 12,
                    right: 12,
                    bottom: 74,
                    zIndex: 'var(--z-topbar)',
                    height: 48,
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-accent)',
                    color: '#fff',
                    fontSize: 'var(--text-base)',
                    fontWeight: 600,
                    boxShadow: 'var(--shadow-lg)',
                    cursor: 'pointer',
                    opacity: taskLimitReached ? 0.6 : 1,
                }, children: ["+ ", t('tasks.create')] })), _jsx(CreateTaskModal, { isOpen: showCreateModal, onClose: () => setShowCreateModal(false) })] }));
}
function MobileTasksList({ tasks }) {
    return (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 10 }, children: tasks.map((task) => (_jsx(MobileTaskCard, { task: task }, task.id))) }));
}
function MobileTaskCard({ task }) {
    const { t } = useTranslation();
    const { updateStatus } = useUpdateTaskStatus();
    const { can } = usePermissions();
    const allowedNext = TASK_STATUS_ALLOWED_NEXT[task.status] ?? [];
    const optionIds = new Set([task.status, ...allowedNext]);
    const statusOptions = STATUS_COLUMNS.filter((col) => optionIds.has(col.id)).map((col) => ({
        value: col.id,
        label: t(col.labelKey),
    }));
    return (_jsxs(Card, { style: { width: '100%' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }, children: [_jsxs("div", { style: { minWidth: 0 }, children: [_jsx("p", { style: { fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.35 }, children: task.title }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }, children: task.assignee })] }), _jsx(Badge, { variant: PRIORITY_VARIANT[task.priority], children: t(PRIORITY_LABEL_KEY[task.priority]) })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, children: [_jsxs("span", { style: { fontSize: 'var(--text-sm)', color: task.overdue ? 'var(--color-danger)' : 'var(--color-text-secondary)', fontWeight: task.overdue ? 600 : 400 }, children: [task.overdue ? '⚠ ' : '', task.dueDate] }), _jsx(StatusBadge, { status: task.status })] }), can('task:changeStatus') && (_jsx(Select, { label: t('common.fields.status'), value: task.status, options: statusOptions, onChange: (e) => {
                    const next = e.target.value;
                    if (next === task.status)
                        return;
                    updateStatus({ taskId: task.id, status: next, taskTitle: task.title });
                } }))] }));
}
// ─── Board view ───────────────────────────────────────────────────────────────
function BoardView({ tasks }) {
    const { t } = useTranslation();
    const { can } = usePermissions();
    const canChangeStatus = can('task:changeStatus');
    return (_jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'start' }, children: STATUS_COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '0 4px' }, children: [_jsx("span", { style: { width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 } }), _jsx("span", { style: { fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }, children: t(col.labelKey) }), _jsx("span", { style: {
                                    marginLeft: 'auto',
                                    fontSize: 'var(--text-xs)',
                                    fontWeight: 500,
                                    color: 'var(--color-text-muted)',
                                    background: 'var(--color-bg-muted)',
                                    padding: '1px 6px',
                                    borderRadius: 'var(--radius-full)',
                                }, children: colTasks.length })] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 }, children: colTasks.length === 0 ? (_jsx("div", { style: {
                                padding: '24px 16px',
                                textAlign: 'center',
                                border: '2px dashed var(--color-border)',
                                borderRadius: 'var(--radius-lg)',
                                color: 'var(--color-text-muted)',
                                fontSize: 'var(--text-sm)',
                            }, children: t('tasks.empty.title') })) : (colTasks.map((task) => (_jsx(TaskCard, { task: task, canChangeStatus: canChangeStatus }, task.id)))) })] }, col.id));
        }) }));
}
// ─── Task card (board) ────────────────────────────────────────────────────────
function TaskCard({ task, canChangeStatus }) {
    const { t } = useTranslation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [hovered, setHovered] = useState(false);
    const { updateStatus } = useUpdateTaskStatus();
    const currentIndex = STATUS_SEQUENCE.indexOf(task.status);
    const nextStatus = STATUS_SEQUENCE[currentIndex + 1];
    return (_jsxs("div", { style: {
            position: 'relative',
            background: 'var(--color-bg)',
            border: `1px solid ${task.overdue ? 'var(--color-danger-border)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '12px',
            cursor: 'default',
            transition: 'box-shadow var(--transition), transform var(--transition)',
            boxShadow: task.overdue
                ? '0 0 0 2px var(--color-danger-subtle)'
                : hovered ? 'var(--shadow-md)' : 'var(--shadow-xs)',
            transform: hovered ? 'translateY(-1px)' : 'none',
        }, onMouseEnter: () => setHovered(true), onMouseLeave: () => { setHovered(false); setMenuOpen(false); }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }, children: [_jsx("p", { style: { fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.4 }, children: task.title }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }, children: [_jsx(Badge, { variant: PRIORITY_VARIANT[task.priority], children: t(PRIORITY_LABEL_KEY[task.priority]) }), canChangeStatus && (TASK_STATUS_ALLOWED_NEXT[task.status] ?? []).length > 0 && (_jsxs("div", { style: { position: 'relative' }, children: [_jsx("button", { onClick: (e) => { e.stopPropagation(); setMenuOpen((o) => !o); }, style: {
                                            width: 22,
                                            height: 22,
                                            display: hovered || menuOpen ? 'flex' : 'none',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: menuOpen ? 'var(--color-bg-muted)' : 'transparent',
                                            border: 'none',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: 'pointer',
                                            color: 'var(--color-text-muted)',
                                            transition: 'background var(--transition)',
                                        }, onMouseEnter: (e) => (e.currentTarget.style.background = 'var(--color-bg-muted)'), onMouseLeave: (e) => !menuOpen && (e.currentTarget.style.background = 'transparent'), children: _jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, children: [_jsx("circle", { cx: "12", cy: "5", r: "1.5", fill: "currentColor", stroke: "none" }), _jsx("circle", { cx: "12", cy: "12", r: "1.5", fill: "currentColor", stroke: "none" }), _jsx("circle", { cx: "12", cy: "19", r: "1.5", fill: "currentColor", stroke: "none" })] }) }), menuOpen && (_jsxs("div", { style: {
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            marginTop: 4,
                                            background: 'var(--color-bg)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-lg)',
                                            boxShadow: 'var(--shadow-lg)',
                                            zIndex: 'var(--z-dropdown)',
                                            overflow: 'hidden',
                                            minWidth: 160,
                                        }, children: [_jsx("p", { style: { padding: '6px 10px 4px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }, children: t('tasks.moveTo') }), (TASK_STATUS_ALLOWED_NEXT[task.status] ?? [])
                                                .map((targetId) => STATUS_COLUMNS.find((c) => c.id === targetId))
                                                .filter((col) => Boolean(col))
                                                .map((col) => (_jsxs("button", { onClick: (e) => {
                                                    e.stopPropagation();
                                                    updateStatus({ taskId: task.id, status: col.id, taskTitle: task.title });
                                                    setMenuOpen(false);
                                                }, style: {
                                                    width: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    padding: '7px 10px',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    fontSize: 'var(--text-sm)',
                                                    color: 'var(--color-text-primary)',
                                                    textAlign: 'left',
                                                    transition: 'background var(--transition-fast)',
                                                }, onMouseEnter: (e) => (e.currentTarget.style.background = 'var(--color-bg-subtle)'), onMouseLeave: (e) => (e.currentTarget.style.background = 'transparent'), children: [_jsx("span", { style: { width: 7, height: 7, borderRadius: '50%', background: col.color, flexShrink: 0 } }), t(col.labelKey)] }, col.id)))] }))] }))] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsx(Avatar, { name: task.assignee, size: "xs" }), _jsxs("span", { style: {
                            fontSize: 'var(--text-xs)',
                            color: task.overdue ? 'var(--color-danger)' : 'var(--color-text-muted)',
                            fontWeight: task.overdue ? 600 : 400,
                        }, children: [task.overdue ? '⚠ ' : '', task.dueDate] })] }), hovered && nextStatus && canChangeStatus && (_jsxs("button", { onClick: () => updateStatus({ taskId: task.id, status: nextStatus, taskTitle: task.title }), style: {
                    position: 'absolute',
                    bottom: -11,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--color-accent)',
                    background: 'var(--color-accent-subtle)',
                    border: '1px solid var(--color-accent-subtle-border)',
                    borderRadius: 'var(--radius-full)',
                    padding: '2px 8px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.6,
                    zIndex: 1,
                }, children: ["\u2192 ", t(STATUS_COLUMNS.find((c) => c.id === nextStatus)?.labelKey ?? 'status.todo')] }))] }));
}
// ─── List view ────────────────────────────────────────────────────────────────
function ListView({ tasks }) {
    return _jsx(MobileTasksList, { tasks: tasks });
}
function StatusBadge({ status }) {
    const { t } = useTranslation();
    const map = {
        TODO: { labelKey: 'status.todo', variant: 'default' },
        IN_PROGRESS: { labelKey: 'status.inProgress', variant: 'warning' },
        IN_REVIEW: { labelKey: 'status.inReview', variant: 'accent' },
        DONE: { labelKey: 'status.done', variant: 'success' },
        CANCELLED: { labelKey: 'status.cancelled', variant: 'default' },
    };
    const { labelKey, variant } = map[status];
    return _jsx(Badge, { variant: variant, dot: true, children: t(labelKey) });
}
