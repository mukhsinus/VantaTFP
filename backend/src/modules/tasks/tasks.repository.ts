import { Pool } from 'pg';
import { ListTasksQuery } from './tasks.schema.js';

export interface TaskRecord {
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
}

export class TasksRepository {
  constructor(private readonly db: Pool) {}

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
      `
      SELECT
        id,
        tenant_id,
        title,
        description,
        assignee_id,
        status,
        priority,
        due_date,
        created_by,
        created_at,
        updated_at
      FROM tasks
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++}
      OFFSET $${paramIndex}
      `,
      values
    );

    return result.rows;
  }

  async findByIdAndTenant(taskId: string, tenantId: string): Promise<TaskRecord | null> {
    const result = await this.db.query<TaskRecord>(
      `
      SELECT
        id,
        tenant_id,
        title,
        description,
        assignee_id,
        status,
        priority,
        due_date,
        created_by,
        created_at,
        updated_at
      FROM tasks
      WHERE id = $1
        AND tenant_id = $2
      LIMIT 1
      `,
      [taskId, tenantId]
    );

    return result.rows[0] ?? null;
  }

  async create(data: Omit<TaskRecord, 'id' | 'created_at' | 'updated_at'>): Promise<TaskRecord> {
    const result = await this.db.query<TaskRecord>(
      `
      INSERT INTO tasks (
        id,
        tenant_id,
        title,
        description,
        assignee_id,
        status,
        priority,
        due_date,
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
        due_date,
        created_by,
        created_at,
        updated_at
      `,
      [
        data.tenant_id,
        data.title,
        data.description,
        data.assignee_id,
        data.status,
        data.priority,
        data.due_date,
        data.created_by,
      ]
    );

    return result.rows[0];
  }

  async update(
    taskId: string,
    tenantId: string,
    data: Partial<Pick<TaskRecord, 'title' | 'description' | 'assignee_id' | 'status' | 'priority' | 'due_date'>>
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
    if (data.due_date !== undefined) {
      fields.push(`due_date = $${paramIndex++}`);
      values.push(data.due_date);
    }

    if (fields.length === 0) {
      const existing = await this.findByIdAndTenant(taskId, tenantId);
      if (!existing) throw new Error('Task not found after update');
      return existing;
    }

    fields.push('updated_at = NOW()');
    values.push(taskId, tenantId);

    const result = await this.db.query<TaskRecord>(
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
        due_date,
        created_by,
        created_at,
        updated_at
      `,
      values
    );

    if (!result.rows[0]) {
      throw new Error('Task not found after update');
    }

    return result.rows[0];
  }

  async delete(taskId: string, tenantId: string): Promise<boolean> {
    const result = await this.db.query(
      `
      DELETE FROM tasks
      WHERE id = $1
        AND tenant_id = $2
      `,
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
      `
      SELECT COUNT(*)::text AS total
      FROM tasks
      WHERE ${conditions.join(' AND ')}
      `,
      values
    );

    return Number(result.rows[0]?.total ?? 0);
  }
}
