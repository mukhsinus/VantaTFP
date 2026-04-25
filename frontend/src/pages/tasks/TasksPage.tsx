import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Avatar, Card, EmptyState, PageSkeleton, Select } from '@shared/components/ui';
import { useTasks } from '@features/tasks/hooks/useTasks';
import { useUpdateTaskStatus } from '@features/tasks/hooks/useUpdateTaskStatus';
import { CreateTaskModal } from '@features/tasks/components/CreateTaskModal';
import { usePermissions } from '@shared/hooks/useCanPerform';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import type { TaskUiModel, TaskStatus, TaskPriority } from '@entities/task/task.types';
import { TASK_STATUS_ALLOWED_NEXT } from '@entities/task/task.transitions';
import { useBilling } from '@features/billing/hooks/useBilling';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLUMNS: { id: TaskStatus; labelKey: string; color: string }[] = [
  { id: 'TODO',        labelKey: 'status.todo',       color: 'var(--color-gray-400)' },
  { id: 'IN_PROGRESS', labelKey: 'status.inProgress', color: 'var(--color-warning)'  },
  { id: 'IN_REVIEW',   labelKey: 'status.inReview',   color: 'var(--color-accent)'   },
  { id: 'DONE',        labelKey: 'status.done',       color: 'var(--color-success)'  },
];

const STATUS_SEQUENCE: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

const PRIORITY_VARIANT: Record<TaskPriority, 'danger' | 'warning' | 'info' | 'default'> = {
  CRITICAL: 'danger',
  HIGH:     'warning',
  MEDIUM:   'info',
  LOW:      'default',
};

const PRIORITY_LABEL_KEY: Record<TaskPriority, string> = {
  LOW: 'status.low',
  MEDIUM: 'status.medium',
  HIGH: 'status.high',
  CRITICAL: 'status.critical',
};

type ViewMode = 'board' | 'list';

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TasksPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [view, setView] = useState<ViewMode>('board');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { role } = useCurrentUser();
  const taskTitle = role === 'EMPLOYEE' ? 'My Tasks' : role === 'MANAGER' ? 'Team Tasks' : t('tasks.title');
  const canSwitchView = role !== 'EMPLOYEE';


  const { tasks, total, isLoading, isError, refetch } = useTasks();
  const { data: billing } = useBilling();
  const { can } = usePermissions();

  const overdueTasks = tasks.filter((task) => task.overdue);
  const taskLimitReached =
    billing &&
    billing.plan.name !== 'platform' &&
    billing.limits.tasks !== null &&
    billing.limits.tasks !== undefined
      ? total >= billing.limits.tasks
      : false;
  const trialExpired = (billing?.status ?? '').toLowerCase() === 'past_due';
  const creationBlocked = taskLimitReached || trialExpired;

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    return (
      <EmptyState
        title={t('errors.loadFailed.title')}
        description={t('errors.loadFailed.description')}
        action={{ label: t('common.actions.retry'), onClick: () => void refetch() }}
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
        }
      />
    );
  }

  return (
    <>
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 10 : 0 }}>
          <div>
            <h2 style={{ fontSize: isMobile ? 'var(--text-xl)' : 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {taskTitle}
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
              {total} {t('tasks.total')}
              {overdueTasks.length > 0 && (
                <>
                  {' · '}
                  <span style={{ color: 'var(--color-danger)', fontWeight: 500 }}>
                    {overdueTasks.length} {t('tasks.overdue')}
                  </span>
                </>
              )}
            </p>
          </div>

          {!isMobile && <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* View toggle */}
            {canSwitchView && <div
              style={{
                display: 'flex',
                background: 'var(--color-bg-muted)',
                borderRadius: 'var(--radius)',
                padding: 3,
                gap: 2,
              }}
            >
              {(['board', 'list'] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
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
                  }}
                >
                  {v === 'board' ? t('tasks.view.board') : t('tasks.view.list')}
                </button>
              ))}
            </div>}

            {can('task:create') && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateModal(true)}
                disabled={creationBlocked}
                leftIcon={
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                }
              >
                {t('tasks.create')}
              </Button>
            )}
          </div>}
        </div>

        {taskLimitReached && (
          <Card style={{ borderColor: 'var(--color-warning-border)', background: 'var(--color-warning-subtle)' }}>
            <p style={{ margin: 0, color: 'var(--color-warning)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              {t('billing.limitReached', { defaultValue: 'Task limit reached for your plan' })}
            </p>
          </Card>
        )}
        {trialExpired && (
          <Card style={{ borderColor: 'var(--color-danger-border)', background: 'var(--color-danger-subtle)' }}>
            <p style={{ margin: 0, color: 'var(--color-danger)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              {t('billing.trial.expiredRequired', { defaultValue: 'Trial expired — upgrade required' })}
            </p>
          </Card>
        )}

        {/* Overdue banner */}
        {overdueTasks.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              background: 'var(--color-danger-subtle)',
              border: '1px solid var(--color-danger-border)',
              borderRadius: 'var(--radius)',
              fontSize: 'var(--text-sm)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
            <span style={{ color: 'var(--color-danger)', fontWeight: 500 }}>
              {overdueTasks.length} {t('tasks.overdueAlert')}
            </span>
          </div>
        )}

        {/* Empty state */}
        {tasks.length === 0 ? (
          <EmptyState
            title={t('tasks.empty.title')}
            description={t('tasks.empty.subtitle')}
            action={can('task:create')
              ? { label: t('tasks.create'), onClick: () => setShowCreateModal(true) }
              : undefined
            }
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            }
          />
        ) : isMobile || role === 'EMPLOYEE' ? (
          <MobileTasksList tasks={tasks} />
        ) : view === 'board' ? (
          <BoardView tasks={tasks} />
        ) : (
          <ListView tasks={tasks} />
        )}
      </div>

      {isMobile && can('task:create') && (
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          disabled={creationBlocked}
          aria-label={t('tasks.create')}
          style={{
            position: 'fixed',
            left: 12,
            right: 12,
            bottom: 74,
            zIndex: 'var(--z-topbar)' as React.CSSProperties['zIndex'],
            height: 48,
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-accent)',
            color: '#fff',
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            boxShadow: 'var(--shadow-lg)',
            cursor: 'pointer',
            opacity: creationBlocked ? 0.6 : 1,
          }}
        >
          + {t('tasks.create')}
        </button>
      )}

      {can('task:create') && (
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </>
  );
}

function MobileTasksList({ tasks }: { tasks: TaskUiModel[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {tasks.map((task) => (
        <MobileTaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}

function MobileTaskCard({ task }: { task: TaskUiModel }) {
  const { t } = useTranslation();
  const { updateStatus } = useUpdateTaskStatus();
  const { can } = usePermissions();

  const allowedNext = TASK_STATUS_ALLOWED_NEXT[task.status] ?? [];
  const optionIds = new Set<TaskStatus>([task.status, ...allowedNext]);
  const statusOptions = STATUS_COLUMNS.filter((col) => optionIds.has(col.id)).map((col) => ({
    value: col.id,
    label: t(col.labelKey),
  }));

  return (
    <Card style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.35 }}>
            {task.title}
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {task.assignee}
          </p>
        </div>
        <Badge variant={PRIORITY_VARIANT[task.priority]}>{t(PRIORITY_LABEL_KEY[task.priority])}</Badge>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 'var(--text-sm)', color: task.overdue ? 'var(--color-danger)' : 'var(--color-text-secondary)', fontWeight: task.overdue ? 600 : 400 }}>
          {task.overdue ? '⚠ ' : ''}{task.dueDate}
        </span>
        <StatusBadge status={task.status} />
      </div>

      {can('task:changeStatus') && (
        <Select
          label={t('common.fields.status')}
          value={task.status}
          options={statusOptions}
          onChange={(e) => {
            const next = e.target.value as TaskStatus;
            if (next === task.status) return;
            updateStatus({ taskId: task.id, status: next, taskTitle: task.title });
          }}
        />
      )}
    </Card>
  );
}

// ─── Board view ───────────────────────────────────────────────────────────────

function BoardView({ tasks }: { tasks: TaskUiModel[] }) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canChangeStatus = can('task:changeStatus');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'start' }}>
      {STATUS_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        return (
          <div key={col.id}>
            {/* Column header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '0 4px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {t(col.labelKey)}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  color: 'var(--color-text-muted)',
                  background: 'var(--color-bg-muted)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {colTasks.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {colTasks.length === 0 ? (
                <div
                  style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    border: '2px dashed var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--color-text-muted)',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  {t('tasks.empty.title')}
                </div>
              ) : (
                colTasks.map((task) => (
                  <TaskCard key={task.id} task={task} canChangeStatus={canChangeStatus} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Task card (board) ────────────────────────────────────────────────────────

function TaskCard({ task, canChangeStatus }: { task: TaskUiModel; canChangeStatus: boolean }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const { updateStatus } = useUpdateTaskStatus();


  const currentIndex = STATUS_SEQUENCE.indexOf(task.status);
  const nextStatus = STATUS_SEQUENCE[currentIndex + 1] as TaskStatus | undefined;
  const prevStatus = currentIndex > 0 ? STATUS_SEQUENCE[currentIndex - 1] as TaskStatus : undefined;

  const isDone = task.status === 'DONE';
  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--color-bg)',
        border: `1px solid ${task.overdue ? 'var(--color-danger-border)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '12px',
        cursor: 'default',
        transition: 'box-shadow var(--transition), transform var(--transition)',
        boxShadow: task.overdue
          ? '0 0 0 2px var(--color-danger-subtle)'
          : 'var(--shadow-xs)',
        transform: 'none',
      }}
      onMouseEnter={() => { if (!isDone) setHovered(true); }}
      onMouseLeave={() => { setHovered(false); }}
    >
      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
          {task.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <Badge variant={PRIORITY_VARIANT[task.priority]}>{t(PRIORITY_LABEL_KEY[task.priority])}</Badge>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Avatar name={task.assignee} size="xs" />
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: task.overdue ? 'var(--color-danger)' : 'var(--color-text-muted)',
            fontWeight: task.overdue ? 600 : 400,
          }}
        >
          {task.overdue ? '⚠ ' : ''}{task.dueDate}
        </span>
      </div>

      {/* Quick advance/back buttons — visible on hover when there is a next/prev status and user has permission, but never for DONE */}
      {!isDone && hovered && canChangeStatus && (prevStatus || nextStatus) && (
        <div style={{
          display: 'flex',
          gap: 8,
          marginTop: 12,
          justifyContent: 'flex-start',
          flexWrap: 'wrap',
        }}>
          {prevStatus && (
            <button
              onClick={() => updateStatus({ taskId: task.id, status: prevStatus, taskTitle: task.title })}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-accent)',
                background: 'var(--color-accent-subtle)',
                border: '1px solid var(--color-accent-subtle-border)',
                borderRadius: 'var(--radius-full)',
                padding: '2px 12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                lineHeight: 1.6,
                zIndex: 1,
                minWidth: 0,
              }}
            >
              ← {t(STATUS_COLUMNS.find((c) => c.id === prevStatus)?.labelKey ?? 'status.todo')}
            </button>
          )}
          {nextStatus && (
            <button
              onClick={() => updateStatus({ taskId: task.id, status: nextStatus, taskTitle: task.title })}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-accent)',
                background: 'var(--color-accent-subtle)',
                border: '1px solid var(--color-accent-subtle-border)',
                borderRadius: 'var(--radius-full)',
                padding: '2px 12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                lineHeight: 1.6,
                zIndex: 1,
                minWidth: 0,
              }}
            >
              → {t(STATUS_COLUMNS.find((c) => c.id === nextStatus)?.labelKey ?? 'status.todo')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({ tasks }: { tasks: TaskUiModel[] }) {
  return <MobileTasksList tasks={tasks} />;
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const { t } = useTranslation();
  const map: Record<TaskStatus, { labelKey: string; variant: 'default' | 'warning' | 'accent' | 'success' }> = {
    TODO:        { labelKey: 'status.todo',       variant: 'default'  },
    IN_PROGRESS: { labelKey: 'status.inProgress', variant: 'warning'  },
    IN_REVIEW:   { labelKey: 'status.inReview',   variant: 'accent'   },
    DONE:        { labelKey: 'status.done',       variant: 'success'  },
    CANCELLED:   { labelKey: 'status.cancelled',  variant: 'default'  },
  };
  const { labelKey, variant } = map[status];
  return <Badge variant={variant} dot>{t(labelKey)}</Badge>;
}
