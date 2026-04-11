import { TasksRepository } from './tasks.repository.js';
import { CreateTaskInput, UpdateTaskInput, ListTasksQuery } from './tasks.schema.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import {
  domainEvents,
  DOMAIN_EVENT_TASK_COMPLETED,
  DOMAIN_EVENT_TASK_CREATED,
  DOMAIN_EVENT_TASK_OVERDUE,
} from '../../shared/events/domain-events.js';
import type { BillingService } from '../billing/billing.service.js';
import { assertTenantEntityMatch } from '../../shared/utils/tenant-scope.js';

const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  TODO: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['IN_REVIEW', 'DONE', 'CANCELLED'],
  IN_REVIEW: ['IN_PROGRESS', 'DONE', 'CANCELLED'],
  DONE: [],
  CANCELLED: [],
};

export type TaskRouteAccessOptions = { actingSuperAdmin?: boolean };

export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly billing: BillingService
  ) {}

  /**
   * When JWT has no tenant (e.g. platform super_admin), resolve scope from the task row.
   */
  private async resolveTaskTenantId(
    taskId: string,
    tenantId: string,
    actingSuperAdmin: boolean
  ): Promise<string> {
    if (tenantId && String(tenantId).trim().length > 0) {
      return tenantId;
    }
    if (!actingSuperAdmin) {
      throw ApplicationError.badRequest('Missing tenant context');
    }
    const tid = await this.tasksRepository.findTenantIdByTaskId(taskId);
    if (!tid) {
      throw ApplicationError.notFound('Task');
    }
    return tid;
  }

  async listTasks(tenantId: string, query: ListTasksQuery, options?: TaskRouteAccessOptions) {
    if (!tenantId || String(tenantId).trim().length === 0) {
      if (options?.actingSuperAdmin) {
        return {
          data: [],
          total: 0,
          page: query.page,
          limit: query.limit,
          totalPages: 1,
        };
      }
      throw ApplicationError.badRequest('Missing tenant context');
    }

    try {
      const [rows, total] = await Promise.all([
        this.tasksRepository.findAllByTenant(tenantId, query),
        this.tasksRepository.countByTenant(tenantId, {
          status: query.status,
          assigneeId: query.assigneeId,
        }),
      ]);

      return {
        data: rows.map((row) => {
          assertTenantEntityMatch(row.tenant_id, tenantId, 'Task');
          return this.toTaskResponse(row);
        }),
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      };
    } catch (error) {
      // Surface a clear service-level error key to avoid opaque 500s.
      throw ApplicationError.internal('TASKS_FETCH_FAILED');
    }
  }

  async getTaskById(taskId: string, tenantId: string, options?: TaskRouteAccessOptions) {
    const effectiveTenantId = await this.resolveTaskTenantId(
      taskId,
      tenantId,
      Boolean(options?.actingSuperAdmin)
    );

    const task = await this.tasksRepository.findByIdAndTenant(taskId, effectiveTenantId);
    if (!task) {
      throw ApplicationError.notFound('Task');
    }
    assertTenantEntityMatch(task.tenant_id, effectiveTenantId, 'Task');

    return this.toTaskResponse(task);
  }

  async createTask(
    tenantId: string,
    createdByUserId: string,
    data: CreateTaskInput,
    options?: { bypassSubscriptionLimits?: boolean }
  ) {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    if (data.assigneeId) {
      const assigneeExists = await this.tasksRepository.existsAssigneeInTenant(
        data.assigneeId,
        tenantId
      );
      if (!assigneeExists) {
        throw ApplicationError.badRequest('assignee_id must belong to the current tenant');
      }
    }

    const created = await this.billing.runAtomicTaskCreation(
      tenantId,
      (tx) =>
        this.tasksRepository.createWithExecutor(
          {
            tenant_id: tenantId,
            title: data.title,
            description: data.description ?? null,
            assignee_id: data.assigneeId ?? null,
            status: 'TODO',
            priority: data.priority,
            deadline: data.deadline ? new Date(data.deadline) : null,
            completed_at: null,
            created_by: createdByUserId,
          },
          tx
        ),
      { bypassSubscriptionChecks: Boolean(options?.bypassSubscriptionLimits) }
    );

    await this.tasksRepository.createAuditLog({
      tenantId,
      taskId: created.id,
      actorUserId: createdByUserId,
      action: 'TASK_CREATED',
      nextStatus: created.status,
      payload: {
        title: created.title,
        assignee_id: created.assignee_id,
        priority: created.priority,
        deadline: created.deadline?.toISOString() ?? null,
      },
    });

    domainEvents.emit(DOMAIN_EVENT_TASK_CREATED, {
      tenantId,
      taskId: created.id,
      actorUserId: createdByUserId,
      assigneeId: created.assignee_id,
      deadline: created.deadline ? created.deadline.toISOString() : null,
    });

    if (
      created.assignee_id &&
      created.deadline &&
      created.status !== 'DONE' &&
      created.deadline.getTime() < Date.now()
    ) {
      await this.markAndEmitTaskOverdueIfNeeded({
        taskId: created.id,
        tenantId,
        actorUserId: createdByUserId,
      });
    }

    assertTenantEntityMatch(created.tenant_id, tenantId, 'Task');
    return this.toTaskResponse(created);
  }

  async updateTask(
    taskId: string,
    tenantId: string,
    actorUserId: string,
    data: UpdateTaskInput,
    options?: TaskRouteAccessOptions
  ) {
    const effectiveTenantId = await this.resolveTaskTenantId(
      taskId,
      tenantId,
      Boolean(options?.actingSuperAdmin)
    );

    const existing = await this.tasksRepository.findByIdAndTenant(taskId, effectiveTenantId);
    if (!existing) {
      throw ApplicationError.notFound('Task');
    }

    if (data.assigneeId) {
      const assigneeExists = await this.tasksRepository.existsAssigneeInTenant(
        data.assigneeId,
        effectiveTenantId
      );
      if (!assigneeExists) {
        throw ApplicationError.badRequest('assignee_id must belong to the current tenant');
      }
    }

    if (data.status && data.status !== existing.status) {
      const allowed = ALLOWED_STATUS_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(data.status)) {
        throw ApplicationError.badRequest(
          `Invalid status transition from ${existing.status} to ${data.status}`
        );
      }
    }

    if (data.completedAt !== undefined && data.status && data.status !== 'DONE') {
      throw ApplicationError.badRequest('completed_at can only be set when status is DONE');
    }

    const nextStatus = data.status ?? existing.status;
    let completedAt: Date | null | undefined;

    if (nextStatus === 'DONE') {
      completedAt = data.completedAt
        ? new Date(data.completedAt)
        : existing.completed_at ?? new Date();
    } else if (data.completedAt === null) {
      completedAt = null;
    } else if (existing.status === 'DONE' && nextStatus !== 'DONE') {
      completedAt = null;
    } else {
      completedAt = undefined;
    }

    const updated = await this.tasksRepository.update(taskId, effectiveTenantId, {
      title: data.title,
      description: data.description,
      assignee_id: data.assigneeId,
      status: data.status,
      priority: data.priority,
      deadline: data.deadline === null
        ? null
        : data.deadline
          ? new Date(data.deadline)
          : undefined,
      completed_at: completedAt,
    });

    await this.tasksRepository.createAuditLog({
      tenantId: effectiveTenantId,
      taskId: updated.id,
      actorUserId,
      action: data.status && data.status !== existing.status ? 'TASK_STATUS_CHANGED' : 'TASK_UPDATED',
      previousStatus: existing.status,
      nextStatus: updated.status,
      payload: {
        changed_fields: Object.keys(data),
      },
    });

    const fieldDiff = this.diffTaskRecords(existing, updated);
    if (fieldDiff) {
      await this.tasksRepository.insertTaskHistory({
        tenantId: effectiveTenantId,
        taskId: updated.id,
        changedBy: actorUserId,
        oldValue: fieldDiff.old,
        newValue: fieldDiff.new,
      });
    }

    if (existing.status !== 'DONE' && updated.status === 'DONE' && updated.completed_at) {
      domainEvents.emit(DOMAIN_EVENT_TASK_COMPLETED, {
        tenantId: effectiveTenantId,
        taskId: updated.id,
        actorUserId,
        assigneeId: updated.assignee_id,
        completedAt: updated.completed_at.toISOString(),
      });
    }

    if (
      updated.assignee_id &&
      updated.status !== 'DONE' &&
      updated.deadline &&
      updated.deadline.getTime() < Date.now()
    ) {
      await this.markAndEmitTaskOverdueIfNeeded({
        taskId: updated.id,
        tenantId: effectiveTenantId,
        actorUserId,
      });
    }

    assertTenantEntityMatch(updated.tenant_id, effectiveTenantId, 'Task');
    return this.toTaskResponse(updated);
  }

  async deleteTask(
    taskId: string,
    tenantId: string,
    actorUserId: string,
    options?: TaskRouteAccessOptions
  ) {
    const effectiveTenantId = await this.resolveTaskTenantId(
      taskId,
      tenantId,
      Boolean(options?.actingSuperAdmin)
    );

    const existing = await this.tasksRepository.findByIdAndTenant(taskId, effectiveTenantId);
    if (!existing) {
      throw ApplicationError.notFound('Task');
    }

    const deleted = await this.tasksRepository.delete(taskId, effectiveTenantId);
    if (!deleted) {
      throw ApplicationError.notFound('Task');
    }

    await this.tasksRepository.createAuditLog({
      tenantId: effectiveTenantId,
      taskId: existing.id,
      actorUserId,
      action: 'TASK_DELETED',
      previousStatus: existing.status,
      nextStatus: null,
      payload: {
        title: existing.title,
      },
    });
  }

  async startTaskTimer(
    taskId: string,
    tenantId: string,
    userId: string,
    options?: TaskRouteAccessOptions
  ) {
    const effectiveTenantId = await this.resolveTaskTenantId(
      taskId,
      tenantId,
      Boolean(options?.actingSuperAdmin)
    );

    const task = await this.tasksRepository.findByIdAndTenant(taskId, effectiveTenantId);
    if (!task) {
      throw ApplicationError.notFound('Task');
    }

    const open = await this.tasksRepository.findAnyOpenTimerForUser(effectiveTenantId, userId);
    if (open) {
      if (open.task_id === taskId) {
        throw ApplicationError.conflict('A timer is already running on this task');
      }
      throw ApplicationError.conflict('Stop your active timer before starting another');
    }

    const hasOverlapsBeforeStart = await this.tasksRepository.hasOverlappingTimersForUser(
      effectiveTenantId,
      userId
    );
    if (hasOverlapsBeforeStart) {
      throw ApplicationError.conflict('Timer data is inconsistent: overlapping intervals detected');
    }

    const row = await this.tasksRepository.insertTimerStart({
      tenantId: effectiveTenantId,
      taskId,
      userId,
    });

    if (row.duration_seconds !== null && row.duration_seconds < 0) {
      throw ApplicationError.conflict('Timer data is inconsistent: negative duration');
    }

    return this.toTimerResponse(row);
  }

  async stopTaskTimer(
    taskId: string,
    tenantId: string,
    userId: string,
    options?: TaskRouteAccessOptions
  ) {
    const effectiveTenantId = await this.resolveTaskTenantId(
      taskId,
      tenantId,
      Boolean(options?.actingSuperAdmin)
    );

    const task = await this.tasksRepository.findByIdAndTenant(taskId, effectiveTenantId);
    if (!task) {
      throw ApplicationError.notFound('Task');
    }

    const open = await this.tasksRepository.findOpenTimerOnTask(effectiveTenantId, taskId, userId);
    if (!open) {
      throw ApplicationError.notFound('Active timer');
    }

    const stopped = await this.tasksRepository.stopOpenTimerOnTask({
      timerId: open.id,
      tenantId: effectiveTenantId,
      userId,
      taskId,
    });
    if (!stopped) {
      const latest = await this.tasksRepository.findLatestTimerForTaskAndUser(
        effectiveTenantId,
        taskId,
        userId
      );
      if (latest?.end_time) {
        throw ApplicationError.conflict('Timer already stopped');
      }
      throw ApplicationError.notFound('Active timer');
    }

    if ((stopped.duration_seconds ?? 0) < 0) {
      throw ApplicationError.conflict('Timer data is inconsistent: negative duration');
    }

    const hasOverlapsAfterStop = await this.tasksRepository.hasOverlappingTimersForUser(
      effectiveTenantId,
      userId
    );
    if (hasOverlapsAfterStop) {
      throw ApplicationError.conflict('Timer data is inconsistent: overlapping intervals detected');
    }

    return this.toTimerResponse(stopped);
  }

  async getTotalTimeByTask(
    taskId: string,
    tenantId: string,
    options?: TaskRouteAccessOptions
  ): Promise<number> {
    const effectiveTenantId = await this.resolveTaskTenantId(
      taskId,
      tenantId,
      Boolean(options?.actingSuperAdmin)
    );
    const task = await this.tasksRepository.findByIdAndTenant(taskId, effectiveTenantId);
    if (!task) {
      throw ApplicationError.notFound('Task');
    }
    return this.tasksRepository.getTotalTimeByTask(effectiveTenantId, taskId);
  }

  async getTotalTimeByUser(userId: string, tenantId: string): Promise<number> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }
    const exists = await this.tasksRepository.existsAssigneeInTenant(userId, tenantId);
    if (!exists) {
      throw ApplicationError.notFound('User');
    }
    return this.tasksRepository.getTotalTimeByUser(tenantId, userId);
  }

  async processOverdueTasksForTenant(
    tenantId: string,
    options?: { limit?: number; actorUserId?: string }
  ): Promise<number> {
    const limit = options?.limit ?? 500;
    const actorUserId = options?.actorUserId ?? 'system';
    const candidates = await this.tasksRepository.listOverdueUnmarkedTasksByTenant(tenantId, limit);
    let emitted = 0;
    for (const task of candidates) {
      const wasMarked = await this.markAndEmitTaskOverdueIfNeeded({
        taskId: task.id,
        tenantId,
        actorUserId,
      });
      if (wasMarked) {
        emitted += 1;
      }
    }
    return emitted;
  }

  async getUnifiedTaskHistory(taskId: string, tenantId: string, options?: TaskRouteAccessOptions) {
    const effectiveTenantId = await this.resolveTaskTenantId(
      taskId,
      tenantId,
      Boolean(options?.actingSuperAdmin)
    );

    const task = await this.tasksRepository.findByIdAndTenant(taskId, effectiveTenantId);
    if (!task) {
      throw ApplicationError.notFound('Task');
    }

    const [histories, audits] = await Promise.all([
      this.tasksRepository.listTaskHistoryForTask(effectiveTenantId, taskId),
      this.tasksRepository.listAuditLogsForTask(effectiveTenantId, taskId),
    ]);

    type UnifiedEntry =
      | {
          source: 'task_history';
          id: string;
          changedBy: string;
          oldValue: Record<string, unknown>;
          newValue: Record<string, unknown>;
          occurredAt: string;
        }
      | {
          source: 'task_audit';
          id: string;
          actorUserId: string;
          action: string;
          previousStatus: string | null;
          nextStatus: string | null;
          payload: Record<string, unknown>;
          occurredAt: string;
        };

    const entries: UnifiedEntry[] = [
      ...histories.map((h) => ({
        source: 'task_history' as const,
        id: h.id,
        changedBy: h.changed_by,
        oldValue: h.old_value,
        newValue: h.new_value,
        occurredAt: h.changed_at.toISOString(),
      })),
      ...audits.map((a) => ({
        source: 'task_audit' as const,
        id: a.id,
        actorUserId: a.actor_user_id,
        action: a.action,
        previousStatus: a.previous_status,
        nextStatus: a.next_status,
        payload: a.payload,
        occurredAt: a.created_at.toISOString(),
      })),
    ];

    entries.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));

    return { entries };
  }

  private pickTaskSnapshot(t: {
    title: string;
    description: string | null;
    assignee_id: string | null;
    status: string;
    priority: string;
    deadline: Date | null;
    completed_at: Date | null;
  }): Record<string, unknown> {
    return {
      title: t.title,
      description: t.description,
      assignee_id: t.assignee_id,
      status: t.status,
      priority: t.priority,
      deadline: t.deadline?.toISOString() ?? null,
      completed_at: t.completed_at?.toISOString() ?? null,
    };
  }

  private diffTaskRecords(
    before: {
      title: string;
      description: string | null;
      assignee_id: string | null;
      status: string;
      priority: string;
      deadline: Date | null;
      completed_at: Date | null;
    },
    after: {
      title: string;
      description: string | null;
      assignee_id: string | null;
      status: string;
      priority: string;
      deadline: Date | null;
      completed_at: Date | null;
    }
  ): { old: Record<string, unknown>; new: Record<string, unknown> } | null {
    const b = this.pickTaskSnapshot(before);
    const a = this.pickTaskSnapshot(after);
    const oldPart: Record<string, unknown> = {};
    const newPart: Record<string, unknown> = {};
    let changed = false;
    for (const key of Object.keys(b)) {
      if (b[key] !== a[key]) {
        oldPart[key] = b[key];
        newPart[key] = a[key];
        changed = true;
      }
    }
    return changed ? { old: oldPart, new: newPart } : null;
  }

  private toTimerResponse(row: {
    id: string;
    task_id: string;
    user_id: string;
    start_time: Date;
    end_time: Date | null;
    duration_seconds: number | null;
  }) {
    return {
      id: row.id,
      taskId: row.task_id,
      userId: row.user_id,
      startTime: row.start_time.toISOString(),
      endTime: row.end_time ? row.end_time.toISOString() : null,
      durationSeconds: row.duration_seconds,
    };
  }

  private async markAndEmitTaskOverdueIfNeeded(params: {
    taskId: string;
    tenantId: string;
    actorUserId: string;
  }): Promise<boolean> {
    const marked = await this.tasksRepository.markTaskAsOverdue(params.taskId, params.tenantId);
    if (!marked || !marked.deadline) {
      return false;
    }
    domainEvents.emit(DOMAIN_EVENT_TASK_OVERDUE, {
      tenantId: params.tenantId,
      taskId: marked.id,
      actorUserId: params.actorUserId,
      assigneeId: marked.assignee_id,
      deadline: marked.deadline.toISOString(),
    });
    return true;
  }

  private toTaskResponse(task: {
    id: string;
    tenant_id: string;
    title: string;
    description: string | null;
    assignee_id: string | null;
    status: string;
    priority: string;
    deadline: Date | null;
    completed_at: Date | null;
    created_by: string;
    created_at: Date;
    updated_at: Date;
  }) {
    return {
      id: task.id,
      tenantId: task.tenant_id,
      title: task.title,
      description: task.description,
      assigneeId: task.assignee_id,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline ? task.deadline.toISOString() : null,
      dueDate: task.deadline ? task.deadline.toISOString() : null,
      completedAt: task.completed_at ? task.completed_at.toISOString() : null,
      completed_at: task.completed_at ? task.completed_at.toISOString() : null,
      assignee_id: task.assignee_id,
      createdBy: task.created_by,
      createdAt: task.created_at.toISOString(),
      updatedAt: task.updated_at.toISOString(),
    };
  }
}
