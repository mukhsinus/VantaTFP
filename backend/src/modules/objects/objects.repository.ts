import { Pool } from 'pg';
import { enforceTenantScope } from '../../shared/repository/tenant-enforcement.js';
import { ListObjectsQuery, ListObjectTasksQuery } from './objects.schema.js';

export interface ObjectRecord {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  object_type: string;
  status: string;
  metadata: Record<string, unknown> | null;
  created_by: string;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ObjectTaskRecord {
  id: string;
  tenant_id: string;
  object_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  status: string;
  priority: string;
  due_date: Date | null;
  completed_at: Date | null;
  started_at: Date | null;
  estimated_duration_minutes: number | null;
  actual_duration_minutes: number | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_by: string;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export class ObjectsRepository {
  constructor(private readonly db: Pool) {}

  private scoped(sql: string, tenantId: string): string {
    return enforceTenantScope(sql, tenantId);
  }

  // ===== OBJECTS OPERATIONS =====

  async createObject(
    tenantId: string,
    data: {
      name: string;
      description: string | null;
      object_type: string;
      status: string;
      metadata: Record<string, unknown> | null;
      created_by: string;
    }
  ): Promise<ObjectRecord> {
    const sql = this.scoped(
      `
      INSERT INTO objects (tenant_id, name, description, object_type, status, metadata, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      tenantId
    );

    const result = await this.db.query<ObjectRecord>(sql, [
      tenantId,
      data.name,
      data.description,
      data.object_type,
      data.status,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.created_by,
    ]);

    return result.rows[0];
  }

  async getObjectById(tenantId: string, objectId: string): Promise<ObjectRecord | null> {
    const sql = this.scoped(
      `
      SELECT * FROM objects
      WHERE id = $1 AND tenant_id = $2
      `,
      tenantId
    );

    const result = await this.db.query<ObjectRecord>(sql, [objectId, tenantId]);
    return result.rows[0] || null;
  }

  async updateObject(
    tenantId: string,
    objectId: string,
    data: Partial<{
      name: string;
      description: string | null;
      object_type: string;
      status: string;
      metadata: Record<string, unknown> | null;
      updated_by: string;
    }>
  ): Promise<ObjectRecord | null> {
    const updates: string[] = [];
    const values: unknown[] = [objectId, tenantId];
    let paramIndex = 3;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.object_type !== undefined) {
      updates.push(`object_type = $${paramIndex++}`);
      values.push(data.object_type);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      values.push(data.metadata ? JSON.stringify(data.metadata) : null);
    }
    if (data.updated_by !== undefined) {
      updates.push(`updated_by = $${paramIndex++}`);
      values.push(data.updated_by);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) return this.getObjectById(tenantId, objectId);

    const sql = this.scoped(
      `
      UPDATE objects
      SET ${updates.join(', ')}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
      `,
      tenantId
    );

    const result = await this.db.query<ObjectRecord>(sql, values);
    return result.rows[0] || null;
  }

  async deleteObject(tenantId: string, objectId: string): Promise<boolean> {
    const sql = this.scoped(
      `
      DELETE FROM objects
      WHERE id = $1 AND tenant_id = $2
      `,
      tenantId
    );

    const result = await this.db.query(sql, [objectId, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async listObjects(tenantId: string, query: ListObjectsQuery): Promise<PaginatedResult<ObjectRecord>> {
    const offset = (query.page - 1) * query.limit;
    let whereClause = 'WHERE tenant_id = $1';
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (query.object_type) {
      whereClause += ` AND object_type = $${paramIndex++}`;
      params.push(query.object_type);
    }

    if (query.status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(query.status);
    }

    if (query.search) {
      whereClause += ` AND (name ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++})`;
      params.push(`%${query.search}%`);
      params.push(`%${query.search}%`);
      paramIndex += 2;
    }

    const orderBy = `${query.sort_by} ${query.sort_order.toUpperCase()}`;

    const countSql = `SELECT COUNT(*) as count FROM objects ${whereClause}`;
    const dataSql = `
      SELECT * FROM objects
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countResult = await this.db.query<{ count: string }>(countSql, params);
    const dataParams = [...params, query.limit, offset];
    const dataResult = await this.db.query<ObjectRecord>(dataSql, dataParams);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page: query.page,
      limit: query.limit,
    };
  }

  // ===== OBJECT TASKS OPERATIONS =====

  async createObjectTask(
    tenantId: string,
    data: {
      object_id: string;
      title: string;
      description: string | null;
      assigned_to: string | null;
      status: string;
      priority: string;
      due_date: Date | null;
      estimated_duration_minutes: number | null;
      notes: string | null;
      metadata: Record<string, unknown> | null;
      created_by: string;
    }
  ): Promise<ObjectTaskRecord> {
    const sql = this.scoped(
      `
      INSERT INTO object_tasks (
        tenant_id, object_id, title, description, assigned_to, status, priority,
        due_date, estimated_duration_minutes, notes, metadata, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
      `,
      tenantId
    );

    const result = await this.db.query<ObjectTaskRecord>(sql, [
      tenantId,
      data.object_id,
      data.title,
      data.description,
      data.assigned_to,
      data.status,
      data.priority,
      data.due_date,
      data.estimated_duration_minutes,
      data.notes,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.created_by,
    ]);

    return result.rows[0];
  }

  async getObjectTaskById(tenantId: string, taskId: string): Promise<ObjectTaskRecord | null> {
    const sql = this.scoped(
      `
      SELECT * FROM object_tasks
      WHERE id = $1 AND tenant_id = $2
      `,
      tenantId
    );

    const result = await this.db.query<ObjectTaskRecord>(sql, [taskId, tenantId]);
    return result.rows[0] || null;
  }

  async updateObjectTask(
    tenantId: string,
    taskId: string,
    data: Partial<{
      title: string;
      description: string | null;
      assigned_to: string | null;
      status: string;
      priority: string;
      due_date: Date | null;
      estimated_duration_minutes: number | null;
      actual_duration_minutes: number | null;
      completed_at: Date | null;
      started_at: Date | null;
      notes: string | null;
      metadata: Record<string, unknown> | null;
      updated_by: string;
    }>
  ): Promise<ObjectTaskRecord | null> {
    const updates: string[] = [];
    const values: unknown[] = [taskId, tenantId];
    let paramIndex = 3;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.assigned_to !== undefined) {
      updates.push(`assigned_to = $${paramIndex++}`);
      values.push(data.assigned_to);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      values.push(data.priority);
    }
    if (data.due_date !== undefined) {
      updates.push(`due_date = $${paramIndex++}`);
      values.push(data.due_date);
    }
    if (data.estimated_duration_minutes !== undefined) {
      updates.push(`estimated_duration_minutes = $${paramIndex++}`);
      values.push(data.estimated_duration_minutes);
    }
    if (data.actual_duration_minutes !== undefined) {
      updates.push(`actual_duration_minutes = $${paramIndex++}`);
      values.push(data.actual_duration_minutes);
    }
    if (data.completed_at !== undefined) {
      updates.push(`completed_at = $${paramIndex++}`);
      values.push(data.completed_at);
    }
    if (data.started_at !== undefined) {
      updates.push(`started_at = $${paramIndex++}`);
      values.push(data.started_at);
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(data.notes);
    }
    if (data.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      values.push(data.metadata ? JSON.stringify(data.metadata) : null);
    }
    if (data.updated_by !== undefined) {
      updates.push(`updated_by = $${paramIndex++}`);
      values.push(data.updated_by);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) return this.getObjectTaskById(tenantId, taskId);

    const sql = this.scoped(
      `
      UPDATE object_tasks
      SET ${updates.join(', ')}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
      `,
      tenantId
    );

    const result = await this.db.query<ObjectTaskRecord>(sql, values);
    return result.rows[0] || null;
  }

  async deleteObjectTask(tenantId: string, taskId: string): Promise<boolean> {
    const sql = this.scoped(
      `
      DELETE FROM object_tasks
      WHERE id = $1 AND tenant_id = $2
      `,
      tenantId
    );

    const result = await this.db.query(sql, [taskId, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async listObjectTasks(
    tenantId: string,
    query: ListObjectTasksQuery
  ): Promise<PaginatedResult<ObjectTaskRecord>> {
    const offset = (query.page - 1) * query.limit;
    let whereClause = 'WHERE tenant_id = $1';
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (query.object_id) {
      whereClause += ` AND object_id = $${paramIndex++}`;
      params.push(query.object_id);
    }

    if (query.status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(query.status);
    }

    if (query.priority) {
      whereClause += ` AND priority = $${paramIndex++}`;
      params.push(query.priority);
    }

    if (query.assigned_to) {
      whereClause += ` AND assigned_to = $${paramIndex++}`;
      params.push(query.assigned_to);
    }

    const orderBy = `${query.sort_by} ${query.sort_order.toUpperCase()}`;

    const countSql = `SELECT COUNT(*) as count FROM object_tasks ${whereClause}`;
    const dataSql = `
      SELECT * FROM object_tasks
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countResult = await this.db.query<{ count: string }>(countSql, params);
    const dataParams = [...params, query.limit, offset];
    const dataResult = await this.db.query<ObjectTaskRecord>(dataSql, dataParams);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page: query.page,
      limit: query.limit,
    };
  }

  // ===== AUDIT LOGGING =====

  async createAuditLog(
    tenantId: string,
    data: {
      object_id?: string;
      object_task_id?: string;
      actor_user_id: string;
      action: string;
      entity_type: string;
      old_value?: Record<string, unknown>;
      new_value?: Record<string, unknown>;
    }
  ): Promise<void> {
    const sql = this.scoped(
      `
      INSERT INTO object_audit_logs (
        tenant_id, object_id, object_task_id, actor_user_id, action, entity_type, old_value, new_value
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      tenantId
    );

    await this.db.query(sql, [
      tenantId,
      data.object_id || null,
      data.object_task_id || null,
      data.actor_user_id,
      data.action,
      data.entity_type,
      data.old_value ? JSON.stringify(data.old_value) : null,
      data.new_value ? JSON.stringify(data.new_value) : null,
    ]);
  }

  async getAuditLogs(tenantId: string, entityId: string, limit = 50): Promise<any[]> {
    const sql = this.scoped(
      `
      SELECT * FROM object_audit_logs
      WHERE (object_id = $2 OR object_task_id = $2)
      ORDER BY created_at DESC
      LIMIT $3
      `,
      tenantId
    );

    const result = await this.db.query(sql, [tenantId, entityId, limit]);
    return result.rows;
  }

  // ===== OBJECT EMPLOYEES OPERATIONS =====

  async assignEmployeeToObject(
    tenantId: string,
    objectId: string,
    userId: string,
    assignedBy: string,
    role: string = 'worker'
  ): Promise<any> {
    const sql = this.scoped(
      `
      INSERT INTO object_employees (tenant_id, object_id, user_id, role, assigned_by)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (object_id, user_id) WHERE removed_at IS NULL
      DO UPDATE SET role = $4, assigned_by = $5, assigned_at = NOW()
      RETURNING *
      `,
      tenantId
    );

    const result = await this.db.query(sql, [tenantId, objectId, userId, role, assignedBy]);
    return result.rows[0];
  }

  async removeEmployeeFromObject(tenantId: string, objectId: string, userId: string): Promise<boolean> {
    const sql = this.scoped(
      `
      UPDATE object_employees
      SET removed_at = NOW()
      WHERE object_id = $1 AND user_id = $2 AND tenant_id = $3 AND removed_at IS NULL
      `,
      tenantId
    );

    const result = await this.db.query(sql, [objectId, userId, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getObjectEmployees(tenantId: string, objectId: string): Promise<any[]> {
    const sql = this.scoped(
      `
      SELECT oe.*, u.id as user_id, u.first_name, u.last_name
      FROM object_employees oe
      JOIN users u ON oe.user_id = u.id
      WHERE oe.object_id = $1 AND oe.tenant_id = $2 AND oe.removed_at IS NULL
      ORDER BY oe.assigned_at DESC
      `,
      tenantId
    );

    const result = await this.db.query(sql, [objectId, tenantId]);
    return result.rows;
  }

  async isEmployeeAssignedToObject(tenantId: string, objectId: string, userId: string): Promise<boolean> {
    const sql = this.scoped(
      `
      SELECT 1 FROM object_employees
      WHERE object_id = $1 AND user_id = $2 AND tenant_id = $3 AND removed_at IS NULL
      LIMIT 1
      `,
      tenantId
    );

    const result = await this.db.query(sql, [objectId, userId, tenantId]);
    return result.rows.length > 0;
  }

  // ===== TASK OBJECT LINKING =====

  async assignTaskToObject(
    tenantId: string,
    taskId: string,
    objectId: string,
    assignedBy: string
  ): Promise<any> {
    const sql = this.scoped(
      `
      INSERT INTO task_objects (tenant_id, task_id, object_id, assigned_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (task_id, object_id) DO NOTHING
      RETURNING *
      `,
      tenantId
    );

    const result = await this.db.query(sql, [tenantId, taskId, objectId, assignedBy]);
    return result.rows[0];
  }

  async removeTaskFromObject(tenantId: string, taskId: string, objectId: string): Promise<boolean> {
    const sql = this.scoped(
      `
      DELETE FROM task_objects
      WHERE task_id = $1 AND object_id = $2 AND tenant_id = $3
      `,
      tenantId
    );

    const result = await this.db.query(sql, [taskId, objectId, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getObjectTasks(tenantId: string, objectId: string): Promise<any[]> {
    const sql = this.scoped(
      `
      SELECT t.*, to.assigned_at
      FROM task_objects to
      JOIN tasks t ON to.task_id = t.id
      WHERE to.object_id = $1 AND to.tenant_id = $2
      ORDER BY to.assigned_at DESC
      `,
      tenantId
    );

    const result = await this.db.query(sql, [objectId, tenantId]);
    return result.rows;
  }

  async getTaskObjects(tenantId: string, taskId: string): Promise<any[]> {
    const sql = this.scoped(
      `
      SELECT o.*, to.assigned_at
      FROM task_objects to
      JOIN objects o ON to.object_id = o.id
      WHERE to.task_id = $1 AND to.tenant_id = $2
      ORDER BY to.assigned_at DESC
      `,
      tenantId
    );

    const result = await this.db.query(sql, [taskId, tenantId]);
    return result.rows;
  }
}
