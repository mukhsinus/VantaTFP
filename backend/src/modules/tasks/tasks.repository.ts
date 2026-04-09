import { Pool, PoolClient } from 'pg';
import { ListTasksQuery } from './tasks.schema.js';
import { enforceTenantScope } from '../../shared/repository/tenant-enforcement.js';

export interface TaskRecord {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  status: string;
  priority: string;
  deadline: Date | null;
  completed_at: Date | null;
  is_overdue?: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export type TaskAuditAction =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_DELETED';

export interface TaskHistoryRecord {
  id: string;
  tenant_id: string;
  task_id: string;
  changed_by: string;
  old_value: Record<string, unknown>;
  new_value: Record<string, unknown>;
  changed_at: Date;
}

export interface TimeTrackingRecord {
  id: string;
  tenant_id: string;
  task_id: string;
  user_id: string;
  start_time: Date;
  end_time: Date | null;
  duration_seconds: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface TimerOverlapRecord {
  id: string;
  tenant_id: string;
  task_id: string;
  user_id: string;
  start_time: Date;
  end_time: Date | null;
}

export interface TaskAuditLogRecord {
  id: string;
  tenant_id: string;
  task_id: string;
  actor_user_id: string;
  action: string;
  previous_status: string | null;
  next_status: string | null;
  payload: Record<string, unknown>;
  created_at: Date;
}

export class TasksRepository {
  constructor(private readonly db: Pool) {}

  private scoped(sql: string, tenantId: string): string {
    return enforceTenantScope(sql, tenantId);
  }

  async findAllByTenant(tenantId: string, filters: ListTasksQuery): Promise<TaskRecord[]> {
    const values: Array<string | number> = [tenantId];
    const conditions: string[] = ['tenant_id = $1'];
    let paramIndex = 2;

    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(filters.status);
    }

    if (filters.assigneeId) {
      conditions.push(`assignee_id = $${paramIndex++}`);
      values.push(filters.assigneeId);
    }

    const limit = filters.limit;
    const offset = (filters.page - 1) * filters.limit;
    values.push(limit, offset);

    const result = await this.db.query<TaskRecord>(
      this.scoped(
        `
      SELECT
        id,
        tenant_id,
        title,
        description,
        assignee_id,
        status,
        priority,
        deadline,
        completed_at,
        created_by,
        created_at,
        updated_at
      FROM tasks
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++}
      OFFSET $${paramIndex}
      `,
        tenantId
      ),
      values
    );

    return result.rows;
  }

  async findByIdAndTenant(taskId: string, tenantId: string): Promise<TaskRecord | null> {
    const result = await this.db.query<TaskRecord>(
      this.scoped(
        `
      SELECT
        id,
        tenant_id,
        title,
        description,
        assignee_id,
        status,
        priority,
        deadline,
        completed_at,
        created_by,
        created_at,
        updated_at
      FROM tasks
      WHERE id = $1
        AND tenant_id = $2
      LIMIT 1
      `,
        tenantId
      ),
      [taskId, tenantId]
    );

    return result.rows[0] ?? null;
  }

  async create(data: Omit<TaskRecord, 'id' | 'created_at' | 'updated_at'>): Promise<TaskRecord> {
    return this.createWithExecutor(data, this.db);
  }

  async createWithExecutor(
    data: Omit<TaskRecord, 'id' | 'created_at' | 'updated_at'>,
    executor: Pick<Pool, 'query'> | Pick<PoolClient, 'query'>
  ): Promise<TaskRecord> {
    const result = await executor.query<TaskRecord>(
      this.scoped(
        `
      INSERT INTO tasks (
        id,
        tenant_id,
        title,
        description,
        assignee_id,
        status,
        priority,
        deadline,
        completed_at,
        created_by,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        NOW(),
        NOW()
      )
      RETURNING
        id,
        tenant_id,
        title,
        description,
        assignee_id,
        status,
        priority,
        deadline,
        completed_at,
        created_by,
        created_at,
        updated_at
      `,
        data.tenant_id
      ),
      [
        data.tenant_id,
        data.title,
        data.description,
        data.assignee_id,
        data.status,
        data.priority,
        data.deadline,
        data.completed_at,
        data.created_by,
      ]
    );

    return result.rows[0];
  }

  async update(
    taskId: string,
    tenantId: string,
    data: Partial<
      Pick<TaskRecord, 'title' | 'description' | 'assignee_id' | 'status' | 'priority' | 'deadline' | 'completed_at'>
    >
  ): Promise<TaskRecord> {
    const fields: string[] = [];
    const values: Array<string | Date | null> = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.assignee_id !== undefined) {
      fields.push(`assignee_id = $${paramIndex++}`);
      values.push(data.assignee_id);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.priority !== undefined) {
      fields.push(`priority = $${paramIndex++}`);
      values.push(data.priority);
    }
    if (data.deadline !== undefined) {
      fields.push(`deadline = $${paramIndex++}`);
      values.push(data.deadline);
    }
    if (data.completed_at !== undefined) {
      fields.push(`completed_at = $${paramIndex++}`);
      values.push(data.completed_at);
    }

    if (fields.length === 0) {
      const existing = await this.findByIdAndTenant(taskId, tenantId);
      if (!existing) throw new Error('Task not found after update');
      return existing;
    }

    fields.push('updated_at = NOW()');
    values.push(taskId, tenantId);

    const result = await this.db.query<TaskRecord>(
      this.scoped(
        `
      UPDATE tasks
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex++}
        AND tenant_id = $${paramIndex}
      RETURNING
        id,
        tenant_id,
        title,
        description,
        assignee_id,
        status,
        priority,
        deadline,
        completed_at,
        created_by,
        created_at,
        updated_at
      `,
        tenantId
      ),
      values
    );

    if (!result.rows[0]) {
      throw new Error('Task not found after update');
    }

    return result.rows[0];
  }

  async delete(taskId: string, tenantId: string): Promise<boolean> {
    const result = await this.db.query(
      this.scoped(
        `
      DELETE FROM tasks
      WHERE id = $1
        AND tenant_id = $2
      `,
        tenantId
      ),
      [taskId, tenantId]
    );

    return (result.rowCount ?? 0) > 0;
  }

  async countByTenant(
    tenantId: string,
    filters: Omit<ListTasksQuery, 'page' | 'limit'>
  ): Promise<number> {
    const values: Array<string> = [tenantId];
    const conditions: string[] = ['tenant_id = $1'];
    let paramIndex = 2;

    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(filters.status);
    }

    if (filters.assigneeId) {
      conditions.push(`assignee_id = $${paramIndex++}`);
      values.push(filters.assigneeId);
    }

    const result = await this.db.query<{ total: string }>(
      this.scoped(
        `
      SELECT COUNT(*)::text AS total
      FROM tasks
      WHERE ${conditions.join(' AND ')}
      `,
        tenantId
      ),
      values
    );

    return Number(result.rows[0]?.total ?? 0);
  }

  async existsAssigneeInTenant(userId: string, tenantId: string): Promise<boolean> {
    const result = await this.db.query<{ exists: boolean }>(
      this.scoped(
        `
      SELECT EXISTS(
        SELECT 1
        FROM users
        WHERE id = $1
          AND tenant_id = $2
          AND is_active = TRUE
      ) AS "exists"
      `,
        tenantId
      ),
      [userId, tenantId]
    );

    return Boolean(result.rows[0]?.exists);
  }

  async createAuditLog(params: {
    tenantId: string;
    taskId: string;
    actorUserId: string;
    action: TaskAuditAction;
    previousStatus?: string | null;
    nextStatus?: string | null;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    await this.db.query(
      this.scoped(
        `
      INSERT INTO task_audit_logs (
        id,
        tenant_id,
        task_id,
        actor_user_id,
        action,
        previous_status,
        next_status,
        payload,
        created_at
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7::jsonb,
        NOW()
      )
      `,
        params.tenantId
      ),
      [
        params.tenantId,
        params.taskId,
        params.actorUserId,
        params.action,
        params.previousStatus ?? null,
        params.nextStatus ?? null,
        JSON.stringify(params.payload ?? {}),
      ]
    );
  }

  async insertTaskHistory(params: {
    tenantId: string;
    taskId: string;
    changedBy: string;
    oldValue: Record<string, unknown>;
    newValue: Record<string, unknown>;
  }): Promise<void> {
    await this.db.query(
      this.scoped(
        `
      INSERT INTO task_history (
        tenant_id,
        task_id,
        changed_by,
        old_value,
        new_value,
        changed_at
      )
      VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, NOW())
      `,
        params.tenantId
      ),
      [
        params.tenantId,
        params.taskId,
        params.changedBy,
        JSON.stringify(params.oldValue),
        JSON.stringify(params.newValue),
      ]
    );
  }

  async findOpenTimerOnTask(
    tenantId: string,
    taskId: string,
    userId: string
  ): Promise<TimeTrackingRecord | null> {
    const result = await this.db.query<TimeTrackingRecord>(
      this.scoped(
        `
      SELECT
        id,
        tenant_id,
        task_id,
        user_id,
        start_time,
        end_time,
        duration_seconds,
        created_at,
        updated_at
      FROM time_tracking
      WHERE tenant_id = $1
        AND task_id = $2
        AND user_id = $3
        AND end_time IS NULL
      ORDER BY start_time DESC
      LIMIT 1
      `,
        tenantId
      ),
      [tenantId, taskId, userId]
    );
    return result.rows[0] ?? null;
  }

  async findAnyOpenTimerForUser(
    tenantId: string,
    userId: string
  ): Promise<TimeTrackingRecord | null> {
    const result = await this.db.query<TimeTrackingRecord>(
      this.scoped(
        `
      SELECT
        id,
        tenant_id,
        task_id,
        user_id,
        start_time,
        end_time,
        duration_seconds,
        created_at,
        updated_at
      FROM time_tracking
      WHERE tenant_id = $1
        AND user_id = $2
        AND end_time IS NULL
      ORDER BY start_time DESC
      LIMIT 1
      `,
        tenantId
      ),
      [tenantId, userId]
    );
    return result.rows[0] ?? null;
  }

  async insertTimerStart(params: {
    tenantId: string;
    taskId: string;
    userId: string;
  }): Promise<TimeTrackingRecord> {
    const result = await this.db.query<TimeTrackingRecord>(
      this.scoped(
        `
      INSERT INTO time_tracking (
        tenant_id,
        task_id,
        user_id,
        start_time,
        updated_at
      )
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING
        id,
        tenant_id,
        task_id,
        user_id,
        start_time,
        end_time,
        duration_seconds,
        created_at,
        updated_at
      `,
        params.tenantId
      ),
      [params.tenantId, params.taskId, params.userId]
    );
    return result.rows[0];
  }

  async findLatestTimerForTaskAndUser(
    tenantId: string,
    taskId: string,
    userId: string
  ): Promise<TimeTrackingRecord | null> {
    const result = await this.db.query<TimeTrackingRecord>(
      this.scoped(
        `
      SELECT
        id,
        tenant_id,
        task_id,
        user_id,
        start_time,
        end_time,
        duration_seconds,
        created_at,
        updated_at
      FROM time_tracking
      WHERE tenant_id = $1
        AND task_id = $2
        AND user_id = $3
      ORDER BY start_time DESC
      LIMIT 1
      `,
        tenantId
      ),
      [tenantId, taskId, userId]
    );
    return result.rows[0] ?? null;
  }

  async stopOpenTimerOnTask(params: {
    timerId: string;
    tenantId: string;
    userId: string;
    taskId: string;
  }): Promise<TimeTrackingRecord | null> {
    const result = await this.db.query<TimeTrackingRecord>(
      this.scoped(
        `
      UPDATE time_tracking
      SET
        end_time = NOW(),
        duration_seconds = GREATEST(
          0,
          FLOOR(EXTRACT(EPOCH FROM (NOW() - start_time)))::int
        ),
        updated_at = NOW()
      WHERE id = $1
        AND tenant_id = $2
        AND user_id = $3
        AND task_id = $4
        AND end_time IS NULL
      RETURNING
        id,
        tenant_id,
        task_id,
        user_id,
        start_time,
        end_time,
        duration_seconds,
        created_at,
        updated_at
      `,
        params.tenantId
      ),
      [params.timerId, params.tenantId, params.userId, params.taskId]
    );
    return result.rows[0] ?? null;
  }

  async hasOverlappingTimersForUser(
    tenantId: string,
    userId: string
  ): Promise<boolean> {
    const result = await this.db.query<{ overlapping: boolean }>(
      this.scoped(
        `
      SELECT EXISTS(
        SELECT 1
        FROM time_tracking a
        INNER JOIN time_tracking b
          ON a.tenant_id = b.tenant_id
         AND a.user_id = b.user_id
         AND a.id < b.id
        WHERE a.tenant_id = $1
          AND a.user_id = $2
          AND COALESCE(a.end_time, NOW()) > b.start_time
          AND COALESCE(b.end_time, NOW()) > a.start_time
      ) AS overlapping
      `,
        tenantId
      ),
      [tenantId, userId]
    );
    return Boolean(result.rows[0]?.overlapping);
  }

  async getTotalTimeByTask(tenantId: string, taskId: string): Promise<number> {
    const result = await this.db.query<{ total_seconds: string }>(
      this.scoped(
        `
      SELECT COALESCE(SUM(GREATEST(duration_seconds, 0)), 0)::text AS total_seconds
      FROM time_tracking
      WHERE tenant_id = $1
        AND task_id = $2
        AND end_time IS NOT NULL
      `,
        tenantId
      ),
      [tenantId, taskId]
    );
    return Number(result.rows[0]?.total_seconds ?? 0);
  }

  async getTotalTimeByUser(tenantId: string, userId: string): Promise<number> {
    const result = await this.db.query<{ total_seconds: string }>(
      this.scoped(
        `
      SELECT COALESCE(SUM(GREATEST(duration_seconds, 0)), 0)::text AS total_seconds
      FROM time_tracking
      WHERE tenant_id = $1
        AND user_id = $2
        AND end_time IS NOT NULL
      `,
        tenantId
      ),
      [tenantId, userId]
    );
    return Number(result.rows[0]?.total_seconds ?? 0);
  }

  async listOverdueUnmarkedTasksByTenant(
    tenantId: string,
    limit = 200
  ): Promise<Array<Pick<TaskRecord, 'id' | 'tenant_id' | 'assignee_id' | 'deadline' | 'created_by'>>> {
    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      assignee_id: string | null;
      deadline: Date | null;
      created_by: string;
    }>(
      this.scoped(
        `
      SELECT id, tenant_id, assignee_id, deadline, created_by
      FROM tasks
      WHERE tenant_id = $1
        AND status <> 'DONE'
        AND deadline IS NOT NULL
        AND deadline < NOW()
        AND COALESCE(is_overdue, FALSE) = FALSE
      ORDER BY deadline ASC
      LIMIT $2
      `,
        tenantId
      ),
      [tenantId, limit]
    );
    return result.rows;
  }

  async markTaskAsOverdue(
    taskId: string,
    tenantId: string
  ): Promise<Pick<TaskRecord, 'id' | 'tenant_id' | 'assignee_id' | 'deadline' | 'created_by'> | null> {
    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      assignee_id: string | null;
      deadline: Date | null;
      created_by: string;
    }>(
      this.scoped(
        `
      UPDATE tasks
      SET
        is_overdue = TRUE,
        updated_at = NOW()
      WHERE id = $1
        AND tenant_id = $2
        AND status <> 'DONE'
        AND deadline IS NOT NULL
        AND deadline < NOW()
        AND COALESCE(is_overdue, FALSE) = FALSE
      RETURNING id, tenant_id, assignee_id, deadline, created_by
      `,
        tenantId
      ),
      [taskId, tenantId]
    );
    return result.rows[0] ?? null;
  }

  async listTaskHistoryForTask(
    tenantId: string,
    taskId: string
  ): Promise<TaskHistoryRecord[]> {
    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      task_id: string;
      changed_by: string;
      old_value: Record<string, unknown>;
      new_value: Record<string, unknown>;
      changed_at: Date;
    }>(
      this.scoped(
        `
      SELECT
        id,
        tenant_id,
        task_id,
        changed_by,
        old_value,
        new_value,
        changed_at
      FROM task_history
      WHERE tenant_id = $1
        AND task_id = $2
      ORDER BY changed_at DESC
      `,
        tenantId
      ),
      [tenantId, taskId]
    );
    return result.rows;
  }

  async listAuditLogsForTask(
    tenantId: string,
    taskId: string
  ): Promise<TaskAuditLogRecord[]> {
    const result = await this.db.query<{
      id: string;
      tenant_id: string;
      task_id: string;
      actor_user_id: string;
      action: string;
      previous_status: string | null;
      next_status: string | null;
      payload: Record<string, unknown>;
      created_at: Date;
    }>(
      this.scoped(
        `
      SELECT
        id,
        tenant_id,
        task_id,
        actor_user_id,
        action,
        previous_status,
        next_status,
        payload,
        created_at
      FROM task_audit_logs
      WHERE tenant_id = $1
        AND task_id = $2
      ORDER BY created_at DESC
      `,
        tenantId
      ),
      [tenantId, taskId]
    );
    return result.rows.map((row) => ({
      ...row,
      payload:
        row.payload && typeof row.payload === 'object'
          ? (row.payload as Record<string, unknown>)
          : {},
    }));
  }
}
