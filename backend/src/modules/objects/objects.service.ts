import { ObjectsRepository, ObjectRecord, ObjectTaskRecord, PaginatedResult } from './objects.repository.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import {
  CreateObjectInput,
  UpdateObjectInput,
  ListObjectsQuery,
  CreateObjectTaskInput,
  UpdateObjectTaskInput,
  ListObjectTasksQuery,
} from './objects.schema.js';

export type ObjectsRouteAccessOptions = { actingSuperAdmin?: boolean };

export class ObjectsService {
  constructor(private readonly objectsRepository: ObjectsRepository) {}

  /**
   * Resolve tenant ID for platform super_admin access
   */
  private resolveTenantId(tenantId: string, actingSuperAdmin: boolean): string {
    if (tenantId && String(tenantId).trim().length > 0) {
      return tenantId;
    }
    if (!actingSuperAdmin) {
      throw ApplicationError.badRequest('Missing tenant context');
    }
    throw ApplicationError.badRequest('Super admin must provide tenant context');
  }

  // ===== OBJECTS SERVICE =====

  async createObject(
    tenantId: string,
    userId: string,
    input: CreateObjectInput,
    options?: ObjectsRouteAccessOptions
  ): Promise<ObjectRecord> {
    const resolvedTenantId = this.resolveTenantId(tenantId, options?.actingSuperAdmin ?? false);

    const object = await this.objectsRepository.createObject(resolvedTenantId, {
      name: input.name,
      description: input.description || null,
      object_type: input.object_type,
      status: input.status || 'active',
      metadata: input.metadata || null,
      created_by: userId,
    });

    // Log audit
    await this.objectsRepository.createAuditLog(resolvedTenantId, {
      object_id: object.id,
      actor_user_id: userId,
      action: 'OBJECT_CREATED',
      entity_type: 'OBJECT',
      new_value: {
        id: object.id,
        name: object.name,
        object_type: object.object_type,
      },
    });

    return object;
  }

  async getObject(
    tenantId: string,
    objectId: string,
    options?: ObjectsRouteAccessOptions
  ): Promise<ObjectRecord> {
    const resolvedTenantId = this.resolveTenantId(tenantId, options?.actingSuperAdmin ?? false);

    const object = await this.objectsRepository.getObjectById(resolvedTenantId, objectId);
    if (!object) {
      throw ApplicationError.notFound('Object');
    }
    return object;
  }

  async updateObject(
    tenantId: string,
    objectId: string,
    userId: string,
    input: UpdateObjectInput,
    options?: ObjectsRouteAccessOptions
  ): Promise<ObjectRecord> {
    const resolvedTenantId = this.resolveTenantId(tenantId, options?.actingSuperAdmin ?? false);

    const existing = await this.objectsRepository.getObjectById(resolvedTenantId, objectId);
    if (!existing) {
      throw ApplicationError.notFound('Object');
    }

    const updated = await this.objectsRepository.updateObject(resolvedTenantId, objectId, {
      name: input.name,
      description: input.description,
      object_type: input.object_type,
      status: input.status,
      metadata: input.metadata,
      updated_by: userId,
    });

    if (!updated) {
      throw ApplicationError.notFound('Object');
    }

    // Log audit
    const changes: Record<string, unknown> = {};
    if (input.name !== undefined && input.name !== existing.name) changes.name = input.name;
    if (input.description !== undefined && input.description !== existing.description) changes.description = input.description;
    if (input.object_type !== undefined && input.object_type !== existing.object_type) changes.object_type = input.object_type;
    if (input.status !== undefined && input.status !== existing.status) changes.status = input.status;

    if (Object.keys(changes).length > 0) {
      await this.objectsRepository.createAuditLog(resolvedTenantId, {
        object_id: objectId,
        actor_user_id: userId,
        action: 'OBJECT_UPDATED',
        entity_type: 'OBJECT',
        old_value: { ...existing },
        new_value: { ...changes },
      });
    }

    return updated;
  }

  async deleteObject(
    tenantId: string,
    objectId: string,
    userId: string,
    options?: ObjectsRouteAccessOptions
  ): Promise<void> {
    const resolvedTenantId = this.resolveTenantId(tenantId, options?.actingSuperAdmin ?? false);

    const existing = await this.objectsRepository.getObjectById(resolvedTenantId, objectId);
    if (!existing) {
      throw ApplicationError.notFound('Object');
    }

    const deleted = await this.objectsRepository.deleteObject(resolvedTenantId, objectId);
    if (!deleted) {
      throw ApplicationError.internalError('Failed to delete object');
    }

    // Log audit
    await this.objectsRepository.createAuditLog(resolvedTenantId, {
      object_id: objectId,
      actor_user_id: userId,
      action: 'OBJECT_DELETED',
      entity_type: 'OBJECT',
      old_value: { ...existing },
    });
  }

  async listObjects(
    tenantId: string,
    query: ListObjectsQuery,
    options?: ObjectsRouteAccessOptions
  ): Promise<PaginatedResult<ObjectRecord>> {
    const resolvedTenantId = this.resolveTenantId(tenantId, options?.actingSuperAdmin ?? false);
    return this.objectsRepository.listObjects(resolvedTenantId, query);
  }

  // ===== OBJECT TASKS SERVICE =====

  async createObjectTask(
    tenantId: string,
    userId: string,
    input: CreateObjectTaskInput,
    options?: ObjectsRouteAccessOptions
  ): Promise<ObjectTaskRecord> {
    const resolvedTenantId = this.resolveTenantId(tenantId, options?.actingSuperAdmin ?? false);

    // Verify object exists
    const object = await this.objectsRepository.getObjectById(resolvedTenantId, input.object_id);
    if (!object) {
      throw ApplicationError.notFound('Object');
    }

    const task = await this.objectsRepository.createObjectTask(resolvedTenantId, {
      object_id: input.object_id,
      title: input.title,
      description: input.description || null,
      assigned_to: input.assigned_to || null,
      status: input.status,
      priority: input.priority,
      due_date: input.due_date || null,
      estimated_duration_minutes: input.estimated_duration_minutes || null,
      notes: input.notes || null,
      metadata: input.metadata || null,
      created_by: userId,
    });

    // Log audit
    await this.objectsRepository.createAuditLog(resolvedTenantId, {
      object_task_id: task.id,
      actor_user_id: userId,
      action: 'TASK_CREATED',
      entity_type: 'OBJECT_TASK',
      new_value: {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
      },
    });

    return task;
  }

  async getObjectTask(
    tenantId: string,
    taskId: string,
    options?: ObjectsRouteAccessOptions
  ): Promise<ObjectTaskRecord> {
    const resolvedTenantId = this.resolveTenantId(tenantId, options?.actingSuperAdmin ?? false);

    const task = await this.objectsRepository.getObjectTaskById(resolvedTenantId, taskId);
    if (!task) {
      throw ApplicationError.notFound('Task');
    }
    return task;
  }

  async updateObjectTask(
    tenantId: string,
    taskId: string,
    userId: string,
    input: UpdateObjectTaskInput,
    options?: ObjectsRouteAccessOptions
  ): Promise<ObjectTaskRecord> {
    const resolvedTenantId = this.resolveTenantId(tenantId, options?.actingSuperAdmin ?? false);

    const existing = await this.objectsRepository.getObjectTaskById(resolvedTenantId, taskId);
    if (!existing) {
      throw ApplicationError.notFound('Task');
    }

    const updated = await this.objectsRepository.updateObjectTask(resolvedTenantId, taskId, {
      title: input.title,
      description: input.description,
      assigned_to: input.assigned_to,
      status: input.status,
      priority: input.priority,
      due_date: input.due_date,
      estimated_duration_minutes: input.estimated_duration_minutes,
      notes: input.notes,
      metadata: input.metadata,
      updated_by: userId,
    });

    if (!updated) {
      throw ApplicationError.notFound('Task');
    }

    // Log audit
    const changes: Record<string, unknown> = {};
    if (input.title !== undefined && input.title !== existing.title) changes.title = input.title;
    if (input.status !== undefined && input.status !== existing.status) changes.status = input.status;
    if (input.priority !== undefined && input.priority !== existing.priority) changes.priority = input.priority;
    if (input.assigned_to !== undefined && input.assigned_to !== existing.assigned_to) changes.assigned_to = input.assigned_to;

    if (Object.keys(changes).length > 0) {
      await this.objectsRepository.createAuditLog(resolvedTenantId, {
        object_task_id: taskId,
        actor_user_id: userId,
        action: 'TASK_UPDATED',
        entity_type: 'OBJECT_TASK',
        old_value: { ...existing },
        new_value: { ...changes },
      });
    }

    return updated;
  }

  async startObjectTask(
    tenantId: string,
    taskId: string,
    userId: string,
    options?: ObjectsRouteAccessOptions
  ): Promise<ObjectTaskRecord> {
    const resolvedTenantId = this.resolveTenantId(tenantId, options?.actingSuperAdmin ?? false);

    const existing = await this.objectsRepository.getObjectTaskById(resolvedTenantId, taskId);
    if (!existing) {
      throw ApplicationError.notFound('Task');
    }

    if (existing.status !== 'pending') {
      throw ApplicationError.badRequest(`Cannot start task with status ${existing.status}`);
    }

    const updated = await this.objectsRepository.updateObjectTask(resolvedTenantId, taskId, {
      status: 'in_progress',
      started_at: new Date(),
      updated_by: userId,
    });

    if (!updated) {
      throw ApplicationError.notFound('Task');
    }

    // Log audit
    await this.objectsRepository.createAuditLog(resolvedTenantId, {
      object_task_id: taskId,
      actor_user_id: userId,
      action: 'TASK_STARTED',
      entity_type: 'OBJECT_TASK',
      old_value: { status: existing.status },
      new_value: { status: 'in_progress' },
    });

    return updated;
  }

  async completeObjectTask(
    tenantId: string,
    taskId: string,
    userId: string,
    notes?: string,
    options?: ObjectsRouteAccessOptions
  ): Promise<ObjectTaskRecord> {
    const resolvedTenantId = this.resolveTenantId(tenantId, options?.actingSuperAdmin ?? false);

    const existing = await this.objectsRepository.getObjectTaskById(resolvedTenantId, taskId);
    if (!existing) {
      throw ApplicationError.notFound('Task');
    }

    if (!['pending', 'in_progress'].includes(existing.status)) {
      throw ApplicationError.badRequest(`Cannot complete task with status ${existing.status}`);
    }

    const now = new Date();
    const actualDuration = existing.started_at
      ? Math.floor((now.getTime() - existing.started_at.getTime()) / 60000)
      : null;

    const updated = await this.objectsRepository.updateObjectTask(resolvedTenantId, taskId, {
      status: 'completed',
      completed_at: now,
      started_at: existing.started_at || now,
      actual_duration_minutes: actualDuration,
      notes: notes,
      updated_by: userId,
    });

    if (!updated) {
      throw ApplicationError.notFound('Task');
    }

    // Log audit
    await this.objectsRepository.createAuditLog(resolvedTenantId, {
      object_task_id: taskId,
      actor_user_id: userId,
      action: 'TASK_COMPLETED',
      entity_type: 'OBJECT_TASK',
      old_value: { status: existing.status },
      new_value: { status: 'completed', actualDuration },
    });

    return updated;
  }

  async deleteObjectTask(
    tenantId: string,
    taskId: string,
    userId: string,
    options?: ObjectsRouteAccessOptions
  ): Promise<void> {
    const resolvedTenantId = this.resolveTenantId(tenantId, options?.actingSuperAdmin ?? false);

    const existing = await this.objectsRepository.getObjectTaskById(resolvedTenantId, taskId);
    if (!existing) {
      throw ApplicationError.notFound('Task');
    }

    const deleted = await this.objectsRepository.deleteObjectTask(resolvedTenantId, taskId);
    if (!deleted) {
      throw ApplicationError.internalError('Failed to delete task');
    }

    // Log audit
    await this.objectsRepository.createAuditLog(resolvedTenantId, {
      object_task_id: taskId,
      actor_user_id: userId,
      action: 'TASK_DELETED',
      entity_type: 'OBJECT_TASK',
      old_value: { ...existing },
    });
  }

  async listObjectTasks(
    tenantId: string,
    query: ListObjectTasksQuery,
    options?: ObjectsRouteAccessOptions
  ): Promise<PaginatedResult<ObjectTaskRecord>> {
    const resolvedTenantId = this.resolveTenantId(tenantId, options?.actingSuperAdmin ?? false);
    return this.objectsRepository.listObjectTasks(resolvedTenantId, query);
  }

  async getObjectAuditLogs(tenantId: string, entityId: string, options?: ObjectsRouteAccessOptions): Promise<any[]> {
    const resolvedTenantId = this.resolveTenantId(tenantId, options?.actingSuperAdmin ?? false);
    return this.objectsRepository.getAuditLogs(resolvedTenantId, entityId);
  }

  // ===== EMPLOYEE ASSIGNMENT =====

  async assignEmployeeToObject(
    tenantId: string,
    userId: string,
    objectId: string,
    assigneeUserId: string,
    role: string = 'worker',
    options?: ObjectsRouteAccessOptions
  ): Promise<any> {
    const resolvedTenantId = this.resolveTenantId(tenantId, options?.actingSuperAdmin ?? false);

    // Verify object exists
    const object = await this.objectsRepository.getObjectById(resolvedTenantId, objectId);
    if (!object) {
      throw ApplicationError.notFound('Object');
    }

    const assignment = await this.objectsRepository.assignEmployeeToObject(
      resolvedTenantId,
      objectId,
      assigneeUserId,
      userId,
      role
    );

    // Log audit
    await this.objectsRepository.createAuditLog(resolvedTenantId, {
      object_id: objectId,
      actor_user_id: userId,
      action: 'EMPLOYEE_ASSIGNED',
      entity_type: 'OBJECT_EMPLOYEE',
      new_value: { user_id: assigneeUserId, role },
    });

    return assignment;
  }

  async removeEmployeeFromObject(
    tenantId: string,
    userId: string,
    objectId: string,
    assigneeUserId: string,
    options?: ObjectsRouteAccessOptions
  ): Promise<void> {
    const resolvedTenantId = this.resolveTenantId(tenantId, options?.actingSuperAdmin ?? false);

    const removed = await this.objectsRepository.removeEmployeeFromObject(
      resolvedTenantId,
      objectId,
      assigneeUserId
    );

    if (!removed) {
      throw ApplicationError.notFound('Employee assignment not found');
    }

    // Log audit
    await this.objectsRepository.createAuditLog(resolvedTenantId, {
      object_id: objectId,
      actor_user_id: userId,
      action: 'EMPLOYEE_REMOVED',
      entity_type: 'OBJECT_EMPLOYEE',
      old_value: { user_id: assigneeUserId },
    });
  }

  async getObjectEmployees(
    tenantId: string,
    objectId: string,
    options?: ObjectsRouteAccessOptions
  ): Promise<any[]> {
    const resolvedTenantId = this.resolveTenantId(tenantId, options?.actingSuperAdmin ?? false);

    // Verify object exists
    const object = await this.objectsRepository.getObjectById(resolvedTenantId, objectId);
    if (!object) {
      throw ApplicationError.notFound('Object');
    }

    return this.objectsRepository.getObjectEmployees(resolvedTenantId, objectId);
  }

  // ===== TASK ASSIGNMENT =====

  async assignTaskToObject(
    tenantId: string,
    userId: string,
    taskId: string,
    objectId: string,
    options?: ObjectsRouteAccessOptions
  ): Promise<any> {
    const resolvedTenantId = this.resolveTenantId(tenantId, options?.actingSuperAdmin ?? false);

    // Verify object exists
    const object = await this.objectsRepository.getObjectById(resolvedTenantId, objectId);
    if (!object) {
      throw ApplicationError.notFound('Object');
    }

    const assignment = await this.objectsRepository.assignTaskToObject(
      resolvedTenantId,
      taskId,
      objectId,
      userId
    );

    // Log audit
    await this.objectsRepository.createAuditLog(resolvedTenantId, {
      object_id: objectId,
      actor_user_id: userId,
      action: 'TASK_ASSIGNED',
      entity_type: 'TASK_OBJECT',
      new_value: { task_id: taskId },
    });

    return assignment;
  }

  async removeTaskFromObject(
    tenantId: string,
    userId: string,
    taskId: string,
    objectId: string,
    options?: ObjectsRouteAccessOptions
  ): Promise<void> {
    const resolvedTenantId = this.resolveTenantId(tenantId, options?.actingSuperAdmin ?? false);

    const removed = await this.objectsRepository.removeTaskFromObject(
      resolvedTenantId,
      taskId,
      objectId
    );

    if (!removed) {
      throw ApplicationError.notFound('Task assignment not found');
    }

    // Log audit
    await this.objectsRepository.createAuditLog(resolvedTenantId, {
      object_id: objectId,
      actor_user_id: userId,
      action: 'TASK_REMOVED',
      entity_type: 'TASK_OBJECT',
      old_value: { task_id: taskId },
    });
  }

  async getObjectTasks(
    tenantId: string,
    objectId: string,
    options?: ObjectsRouteAccessOptions
  ): Promise<any[]> {
    const resolvedTenantId = this.resolveTenantId(tenantId, options?.actingSuperAdmin ?? false);

    // Verify object exists
    const object = await this.objectsRepository.getObjectById(resolvedTenantId, objectId);
    if (!object) {
      throw ApplicationError.notFound('Object');
    }

    return this.objectsRepository.getObjectTasks(resolvedTenantId, objectId);
  }

  async getTaskObjects(
    tenantId: string,
    taskId: string,
    options?: ObjectsRouteAccessOptions
  ): Promise<any[]> {
    const resolvedTenantId = this.resolveTenantId(tenantId, options?.actingSuperAdmin ?? false);
    return this.objectsRepository.getTaskObjects(resolvedTenantId, taskId);
  }
}
