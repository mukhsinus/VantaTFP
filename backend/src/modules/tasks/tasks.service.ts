import { TasksRepository } from './tasks.repository.js';
import { CreateTaskInput, UpdateTaskInput, ListTasksQuery } from './tasks.schema.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { domainEvents, DOMAIN_EVENT_TASK_COMPLETED } from '../../shared/events/domain-events.js';

const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  TODO: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['IN_REVIEW', 'DONE', 'CANCELLED'],
  IN_REVIEW: ['IN_PROGRESS', 'DONE', 'CANCELLED'],
  DONE: [],
  CANCELLED: [],
};

export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async listTasks(tenantId: string, query: ListTasksQuery) {
    if (!tenantId) {
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
        data: rows.map((row) => this.toTaskResponse(row)),
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

  async getTaskById(taskId: string, tenantId: string) {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const task = await this.tasksRepository.findByIdAndTenant(taskId, tenantId);
    if (!task) {
      throw ApplicationError.notFound('Task');
    }

    return this.toTaskResponse(task);
  }

  async createTask(tenantId: string, createdByUserId: string, data: CreateTaskInput) {
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

    const created = await this.tasksRepository.create({
      tenant_id: tenantId,
      title: data.title,
      description: data.description ?? null,
      assignee_id: data.assigneeId ?? null,
      status: 'TODO',
      priority: data.priority,
      deadline: data.deadline ? new Date(data.deadline) : null,
      completed_at: null,
      created_by: createdByUserId,
    });

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

    return this.toTaskResponse(created);
  }

  async updateTask(taskId: string, tenantId: string, actorUserId: string, data: UpdateTaskInput) {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const existing = await this.tasksRepository.findByIdAndTenant(taskId, tenantId);
    if (!existing) {
      throw ApplicationError.notFound('Task');
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

    const updated = await this.tasksRepository.update(taskId, tenantId, {
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
      tenantId,
      taskId: updated.id,
      actorUserId,
      action: data.status && data.status !== existing.status ? 'TASK_STATUS_CHANGED' : 'TASK_UPDATED',
      previousStatus: existing.status,
      nextStatus: updated.status,
      payload: {
        changed_fields: Object.keys(data),
      },
    });

    if (existing.status !== 'DONE' && updated.status === 'DONE' && updated.completed_at) {
      domainEvents.emit(DOMAIN_EVENT_TASK_COMPLETED, {
        tenantId,
        taskId: updated.id,
        actorUserId,
        assigneeId: updated.assignee_id,
        completedAt: updated.completed_at.toISOString(),
      });
    }

    return this.toTaskResponse(updated);
  }

  async deleteTask(taskId: string, tenantId: string, actorUserId: string) {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const existing = await this.tasksRepository.findByIdAndTenant(taskId, tenantId);
    if (!existing) {
      throw ApplicationError.notFound('Task');
    }

    const deleted = await this.tasksRepository.delete(taskId, tenantId);
    if (!deleted) {
      throw ApplicationError.notFound('Task');
    }

    await this.tasksRepository.createAuditLog({
      tenantId,
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
