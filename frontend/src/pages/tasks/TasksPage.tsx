import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Avatar, Card, EmptyState, PageSkeleton } from '@shared/components/ui';
import { useTasks } from '@features/tasks/hooks/useTasks';
import { useUpdateTaskStatus } from '@features/tasks/hooks/useUpdateTaskStatus';
import { CreateTaskModal } from '@features/tasks/components/CreateTaskModal';
import type { TaskUiModel, TaskStatus, TaskPriority } from '@entities/task/task.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'TODO',        label: 'To Do',       color: 'var(--color-gray-400)' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'var(--color-warning)'  },
  { id: 'IN_REVIEW',   label: 'In Review',   color: 'var(--color-accent)'   },
  { id: 'DONE',        label: 'Done',        color: 'var(--color-success)'  },
];

const STATUS_SEQUENCE: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

const PRIORITY_VARIANT: Record<TaskPriority, 'danger' | 'warning' | 'info' | 'default'> = {
  CRITICAL: 'danger',
  HIGH:     'warning',
  MEDIUM:   'info',
  LOW:      'default',
};

type ViewMode = 'board' | 'list';

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TasksPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<ViewMode>('board');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { tasks, total, isLoading, isError } = useTasks();

  const overdueTasks = tasks.filter((task) => task.overdue);

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    return (
      <EmptyState
        title={t('common.errorTitle')}
        description={t('common.errorDescription')}
        action={{ label: t('common.retry'), onClick: () => window.location.reload() }}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {t('tasks.title')}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* View toggle */}
            <div
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
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              leftIcon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 5v14M5 12h14" />
                </svg>
              }
            >
              {t('tasks.create')}
            </Button>
          </div>
        </div>

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
            title={t('tasks.emptyState.title')}
            description={t('tasks.emptyState.description')}
            action={{ label: t('tasks.create'), onClick: () => setShowCreateModal(true) }}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            }
          />
        ) : view === 'board' ? (
          <BoardView tasks={tasks} />
        ) : (
          <ListView tasks={tasks} />
        )}
      </div>

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}

// ─── Board view ───────────────────────────────────────────────────────────────

function BoardView({ tasks }: { tasks: TaskUiModel[] }) {
  const { t } = useTranslation();

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
                {col.label}
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
                  {t('tasks.empty')}
                </div>
              ) : (
                colTasks.map((task) => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Task card (board) ────────────────────────────────────────────────────────

function TaskCard({ task }: { task: TaskUiModel }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { updateStatus } = useUpdateTaskStatus();

  const currentIndex = STATUS_SEQUENCE.indexOf(task.status);
  const nextStatus = STATUS_SEQUENCE[currentIndex + 1] as TaskStatus | undefined;

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
          : hovered ? 'var(--shadow-md)' : 'var(--shadow-xs)',
        transform: hovered ? 'translateY(-1px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
    >
      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
          {task.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <Badge variant={PRIORITY_VARIANT[task.priority]}>{task.priority}</Badge>

          {/* Status action menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
              style={{
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
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-muted)')}
              onMouseLeave={(e) => !menuOpen && (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </button>

            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 4,
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 'var(--z-dropdown)' as React.CSSProperties['zIndex'],
                  overflow: 'hidden',
                  minWidth: 160,
                }}
              >
                <p style={{ padding: '6px 10px 4px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Move to
                </p>
                {STATUS_COLUMNS.filter((col) => col.id !== task.status).map((col) => (
                  <button
                    key={col.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatus({ taskId: task.id, status: col.id, taskTitle: task.title });
                      setMenuOpen(false);
                    }}
                    style={{
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
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                    {col.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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

      {/* Quick advance button — visible on hover when there is a next status */}
      {hovered && nextStatus && (
        <button
          onClick={() => updateStatus({ taskId: task.id, status: nextStatus, taskTitle: task.title })}
          style={{
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
          }}
        >
          → {STATUS_COLUMNS.find((c) => c.id === nextStatus)?.label}
        </button>
      )}
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({ tasks }: { tasks: TaskUiModel[] }) {
  const { t } = useTranslation();
  const { updateStatus } = useUpdateTaskStatus();

  return (
    <Card padding="none">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)' }}>
            {[
              t('tasks.col.title'),
              t('tasks.col.assignee'),
              t('tasks.col.priority'),
              t('tasks.col.due'),
              t('tasks.col.status'),
            ].map((h) => (
              <th
                key={h}
                style={{
                  padding: '10px 16px',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <ListRow
              key={task.id}
              task={task}
              onStatusChange={(status) =>
                updateStatus({ taskId: task.id, status, taskTitle: task.title })
              }
            />
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function ListRow({
  task,
  onStatusChange,
}: {
  task: TaskUiModel;
  onStatusChange: (status: TaskStatus) => void;
}) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  return (
    <tr
      style={{
        borderBottom: '1px solid var(--color-border)',
        background: task.overdue ? 'var(--color-danger-subtle)' : 'transparent',
        transition: 'background var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        if (!task.overdue) (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-subtle)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          task.overdue ? 'var(--color-danger-subtle)' : 'transparent';
      }}
    >
      {/* Title */}
      <td style={{ padding: '12px 16px' }}>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {task.title}
        </p>
        {task.description && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
            {task.description}
          </p>
        )}
      </td>

      {/* Assignee */}
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={task.assignee} size="xs" />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            {task.assignee}
          </span>
        </div>
      </td>

      {/* Priority */}
      <td style={{ padding: '12px 16px' }}>
        <Badge variant={PRIORITY_VARIANT[task.priority]}>{task.priority}</Badge>
      </td>

      {/* Due date */}
      <td style={{ padding: '12px 16px' }}>
        <span
          style={{
            fontSize: 'var(--text-sm)',
            color: task.overdue ? 'var(--color-danger)' : 'var(--color-text-secondary)',
            fontWeight: task.overdue ? 600 : 400,
          }}
        >
          {task.overdue ? '⚠ ' : ''}{task.dueDate}
        </span>
      </td>

      {/* Status — click to change */}
      <td style={{ padding: '12px 16px' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            onClick={() => setStatusMenuOpen((o) => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <StatusBadge status={task.status} />
          </button>

          {statusMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 4,
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 'var(--z-dropdown)' as React.CSSProperties['zIndex'],
                overflow: 'hidden',
                minWidth: 160,
              }}
            >
              {STATUS_COLUMNS.filter((col) => col.id !== task.status).map((col) => (
                <button
                  key={col.id}
                  onClick={() => { onStatusChange(col.id); setStatusMenuOpen(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-primary)',
                    textAlign: 'left',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                  {col.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, { label: string; variant: 'default' | 'warning' | 'accent' | 'success' }> = {
    TODO:        { label: 'To Do',       variant: 'default'  },
    IN_PROGRESS: { label: 'In Progress', variant: 'warning'  },
    IN_REVIEW:   { label: 'In Review',   variant: 'accent'   },
    DONE:        { label: 'Done',        variant: 'success'  },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}
