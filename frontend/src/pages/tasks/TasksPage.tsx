import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Avatar, Card, EmptyState } from '@shared/components/ui';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface Task {
  id: string;
  title: string;
  assignee: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
  overdue?: boolean;
}

const mockTasks: Task[] = [
  { id: '1', title: 'Design onboarding flow', assignee: 'Sofia Chen', priority: 'HIGH', dueDate: 'Apr 5', status: 'IN_PROGRESS' },
  { id: '2', title: 'Invoice Processing', assignee: 'James Park', priority: 'CRITICAL', dueDate: 'Apr 1', status: 'TODO', overdue: true },
  { id: '3', title: 'Q1 Report Draft', assignee: 'Amara Diallo', priority: 'MEDIUM', dueDate: 'Apr 8', status: 'IN_REVIEW' },
  { id: '4', title: 'Team Retrospective', assignee: 'Luca Ferrari', priority: 'LOW', dueDate: 'Apr 10', status: 'TODO' },
  { id: '5', title: 'Client Proposal', assignee: 'Maria Santos', priority: 'HIGH', dueDate: 'Apr 6', status: 'DONE' },
  { id: '6', title: 'Budget Review Q4', assignee: 'Sofia Chen', priority: 'HIGH', dueDate: 'Mar 30', status: 'TODO', overdue: true },
];

const columns: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'TODO', label: 'To Do', color: 'var(--color-gray-400)' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'var(--color-warning)' },
  { id: 'IN_REVIEW', label: 'In Review', color: 'var(--color-accent)' },
  { id: 'DONE', label: 'Done', color: 'var(--color-success)' },
];

const priorityVariant: Record<TaskPriority, 'danger' | 'warning' | 'info' | 'default'> = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'default',
};

type ViewMode = 'board' | 'list';

export function TasksPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<ViewMode>('board');
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {t('tasks.title')}
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {mockTasks.length} {t('tasks.total')}
            {' · '}
            <span style={{ color: 'var(--color-danger)', fontWeight: 500 }}>
              {mockTasks.filter((t) => t.overdue).length} {t('tasks.overdue')}
            </span>
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
      {mockTasks.some((t) => t.overdue) && (
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
            {mockTasks.filter((t) => t.overdue).length} {t('tasks.overdueAlert')}
          </span>
        </div>
      )}

      {view === 'board' ? (
        <BoardView tasks={mockTasks} />
      ) : (
        <ListView tasks={mockTasks} />
      )}
    </div>
  );
}

function BoardView({ tasks }: { tasks: Task[] }) {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'start' }}>
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        return (
          <div key={col.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                padding: '0 4px',
              }}
            >
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

function TaskCard({ task }: { task: Task }) {
  return (
    <div
      style={{
        background: 'var(--color-bg)',
        border: `1px solid ${task.overdue ? 'var(--color-danger-border)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '12px',
        cursor: 'pointer',
        transition: 'box-shadow var(--transition), transform var(--transition)',
        boxShadow: task.overdue ? '0 0 0 2px var(--color-danger-subtle)' : 'var(--shadow-xs)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = task.overdue ? '0 0 0 2px var(--color-danger-subtle)' : 'var(--shadow-xs)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            lineHeight: 1.4,
          }}
        >
          {task.title}
        </p>
        <Badge variant={priorityVariant[task.priority]} style={{ flexShrink: 0 }}>
          {task.priority}
        </Badge>
      </div>
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
    </div>
  );
}

function ListView({ tasks }: { tasks: Task[] }) {
  const { t } = useTranslation();

  return (
    <Card padding="none">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)' }}>
            {[t('tasks.col.title'), t('tasks.col.assignee'), t('tasks.col.priority'), t('tasks.col.due'), t('tasks.col.status')].map((h) => (
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
            <tr
              key={task.id}
              style={{
                borderBottom: '1px solid var(--color-border)',
                background: task.overdue ? 'var(--color-danger-subtle)' : 'transparent',
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                if (!task.overdue) (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-subtle)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = task.overdue ? 'var(--color-danger-subtle)' : 'transparent';
              }}
            >
              <td style={{ padding: '12px 16px' }}>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  {task.title}
                </p>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={task.assignee} size="xs" />
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    {task.assignee}
                  </span>
                </div>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
              </td>
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
              <td style={{ padding: '12px 16px' }}>
                <StatusBadge status={task.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, { label: string; variant: 'default' | 'warning' | 'accent' | 'success' }> = {
    TODO: { label: 'To Do', variant: 'default' },
    IN_PROGRESS: { label: 'In Progress', variant: 'warning' },
    IN_REVIEW: { label: 'In Review', variant: 'accent' },
    DONE: { label: 'Done', variant: 'success' },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}
