import { Pool } from 'pg';
import { ListAuditLogsQuery } from './admin.schema.js';

export interface AuditLogRecord {
  id: string;
  tenant_id: string;
  action: string;
  entity: string;
  user_id: string;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface TenantAdminRecord {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class AdminRepository {
  constructor(private readonly db: Pool) {}

  async insertAuditLog(params: {
    tenantId: string;
    action: string;
    entity: string;
    userId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.db.query(
      `
      INSERT INTO audit_logs (tenant_id, action, entity, user_id, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
      `,
      [
        params.tenantId,
        params.action,
        params.entity,
        params.userId,
        JSON.stringify(params.metadata ?? {}),
      ]
    );
  }

  async listAuditLogs(
    tenantId: string,
    query: ListAuditLogsQuery
  ): Promise<AuditLogRecord[]> {
    const values: Array<string | number> = [tenantId];
    const conditions: string[] = ['tenant_id = $1'];
    let i = 2;

    if (query.action) {
      conditions.push(`action = $${i++}`);
      values.push(query.action);
    }
    if (query.entity) {
      conditions.push(`entity = $${i++}`);
      values.push(query.entity);
    }
    if (query.userId) {
      conditions.push(`user_id = $${i++}`);
      values.push(query.userId);
    }

    const offset = (query.page - 1) * query.limit;
    values.push(query.limit, offset);
    const result = await this.db.query<AuditLogRecord>(
      `
      SELECT id, tenant_id, action, entity, user_id, metadata, created_at
      FROM audit_logs
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${i++} OFFSET $${i}
      `,
      values
    );
    return result.rows;
  }

  async countAuditLogs(tenantId: string, query: ListAuditLogsQuery): Promise<number> {
    const values: string[] = [tenantId];
    const conditions: string[] = ['tenant_id = $1'];
    let i = 2;

    if (query.action) {
      conditions.push(`action = $${i++}`);
      values.push(query.action);
    }
    if (query.entity) {
      conditions.push(`entity = $${i++}`);
      values.push(query.entity);
    }
    if (query.userId) {
      conditions.push(`user_id = $${i++}`);
      values.push(query.userId);
    }

    const result = await this.db.query<{ c: string }>(
      `
      SELECT COUNT(*)::text AS c
      FROM audit_logs
      WHERE ${conditions.join(' AND ')}
      `,
      values
    );
    return Number(result.rows[0]?.c ?? 0);
  }

  async getTenant(tenantId: string): Promise<TenantAdminRecord | null> {
    const result = await this.db.query<TenantAdminRecord>(
      `
      SELECT id, name, slug, plan, is_active, created_at, updated_at
      FROM tenants
      WHERE id = $1
      LIMIT 1
      `,
      [tenantId]
    );
    return result.rows[0] ?? null;
  }

  async updateTenant(
    tenantId: string,
    data: { name?: string; plan?: string }
  ): Promise<TenantAdminRecord> {
    const fields: string[] = [];
    const values: string[] = [];
    let i = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${i++}`);
      values.push(data.name);
    }
    if (data.plan !== undefined) {
      fields.push(`plan = $${i++}`);
      values.push(data.plan);
    }
    fields.push('updated_at = NOW()');
    values.push(tenantId);

    const result = await this.db.query<TenantAdminRecord>(
      `
      UPDATE tenants
      SET ${fields.join(', ')}
      WHERE id = $${i}
      RETURNING id, name, slug, plan, is_active, created_at, updated_at
      `,
      values
    );
    return result.rows[0];
  }

  async deactivateTenant(tenantId: string): Promise<void> {
    await this.db.query(
      `
      UPDATE tenants
      SET is_active = FALSE, updated_at = NOW()
      WHERE id = $1
      `,
      [tenantId]
    );
  }

  async getTenantStats(tenantId: string): Promise<{
    usersTotal: number;
    usersActive: number;
    tasksTotal: number;
    tasksOpen: number;
    tasksDone: number;
  }> {
    const result = await this.db.query<{
      users_total: string;
      users_active: string;
      tasks_total: string;
      tasks_open: string;
      tasks_done: string;
    }>(
      `
      SELECT
        (SELECT COUNT(*)::text FROM users WHERE tenant_id = $1) AS users_total,
        (SELECT COUNT(*)::text FROM users WHERE tenant_id = $1 AND is_active = TRUE) AS users_active,
        (SELECT COUNT(*)::text FROM tasks WHERE tenant_id = $1) AS tasks_total,
        (SELECT COUNT(*)::text FROM tasks WHERE tenant_id = $1 AND status <> 'DONE') AS tasks_open,
        (SELECT COUNT(*)::text FROM tasks WHERE tenant_id = $1 AND status = 'DONE') AS tasks_done
      `,
      [tenantId]
    );
    const row = result.rows[0];
    return {
      usersTotal: Number(row?.users_total ?? 0),
      usersActive: Number(row?.users_active ?? 0),
      tasksTotal: Number(row?.tasks_total ?? 0),
      tasksOpen: Number(row?.tasks_open ?? 0),
      tasksDone: Number(row?.tasks_done ?? 0),
    };
  }

  async dbPing(): Promise<boolean> {
    try {
      await this.db.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
