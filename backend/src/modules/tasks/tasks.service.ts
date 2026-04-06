import { TasksRepository } from './tasks.repository.js';
import { CreateTaskDto, UpdateTaskDto, ListTasksQuery } from './tasks.schema.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { getTierFeatures } from '../../shared/config/tier.config.js';

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

  async createTask(tenantId: string, createdByUserId: string, data: CreateTaskDto) {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const created = await this.tasksRepository.create({
      tenant_id: tenantId,
      title: data.title,
      description: data.description ?? null,
      assignee_id: data.assigneeId ?? null,
      status: 'TODO',
      priority: data.priority,
      due_date: data.dueDate ? new Date(data.dueDate) : null,
      created_by: createdByUserId,
    });

    return this.toTaskResponse(created);
  }

  async updateTask(taskId: string, tenantId: string, data: UpdateTaskDto) {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const existing = await this.tasksRepository.findByIdAndTenant(taskId, tenantId);
    if (!existing) {
      throw ApplicationError.notFound('Task');
    }

    const updated = await this.tasksRepository.update(taskId, tenantId, {
      title: data.title,
      description: data.description,
      assignee_id: data.assigneeId,
      status: data.status,
      priority: data.priority,
      due_date: data.dueDate === null
        ? null
        : data.dueDate
          ? new Date(data.dueDate)
          : undefined,
    });

    return this.toTaskResponse(updated);
  }

  async deleteTask(taskId: string, tenantId: string) {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const deleted = await this.tasksRepository.delete(taskId, tenantId);
    if (!deleted) {
      throw ApplicationError.notFound('Task');
    }
  }

  /**
   * Check if a specific task feature is available for the tenant plan
   */
  checkFeatureAvailable(tenantPlan: string, feature: 'timeTracking' | 'auditHistory'): void {
    const tierFeatures = getTierFeatures(tenantPlan);
    const isAvailable = tierFeatures.tasksFeatures[feature];

    if (!isAvailable) {
      const featureName = feature === 'timeTracking' ? 'Time Tracking' : 'Task History & Audit';
      throw ApplicationError.forbidden(
        `${featureName} is not available in your current plan (${tenantPlan}). Please upgrade to PRO or ENTERPRISE.`
      );
    }
  }

  private toTaskResponse(task: {
    id: string;
    tenant_id: string;
    title: string;
    description: string | null;
    assignee_id: string | null;
    status: string;
    priority: string;
    due_date: Date | null;
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
      dueDate: task.due_date ? task.due_date.toISOString() : null,
      createdBy: task.created_by,
      createdAt: task.created_at.toISOString(),
      updatedAt: task.updated_at.toISOString(),
    };
  }
}
