import { Pool } from 'pg';
import { ListAuditLogsQuery } from './admin.schema.js';
import { getAuthSchemaCaps } from '../auth/auth-schema-caps.js';

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

export interface AdminPaymentRequestRecord {
  id: string;
  tenant_id: string;
  tenant_name: string;
  plan_id: string;
  plan_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
}

export interface AdminSubscriptionRecord {
  tenant_id: string;
  tenant_name: string;
  status: string;
  plan_name: string | null;
  limits: Record<string, unknown> | null;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  system_role: string;
  role: string;
  tenant_role: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
  is_active: boolean;
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

  async listPaymentRequests(
    status: 'pending' | 'approved' | 'rejected' | undefined,
    page: number,
    limit: number
  ): Promise<{ rows: AdminPaymentRequestRecord[]; total: number }> {
    const offset = (page - 1) * limit;
    const params: Array<string | number> = [];
    let where = '';

    if (status) {
      params.push(status);
      where = `WHERE pr.status = $1`;
    }

    const countResult = await this.db.query<{ total: string }>(
      `
      SELECT COUNT(*)::text AS total
      FROM payment_requests pr
      ${where}
      `,
      params
    );

    params.push(limit, offset);
    const limitIdx = params.length - 1;
    const offsetIdx = params.length;
    const rows = await this.db.query<AdminPaymentRequestRecord>(
      `
      SELECT
        pr.id,
        pr.tenant_id,
        t.name AS tenant_name,
        pr.plan_id,
        p.name AS plan_name,
        pr.status::text AS status,
        pr.created_at
      FROM payment_requests pr
      INNER JOIN tenants t ON t.id = pr.tenant_id
      LEFT JOIN plans p ON p.id = pr.plan_id
      ${where}
      ORDER BY pr.created_at ASC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
      params
    );

    return {
      rows: rows.rows,
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  }

  async listSubscriptions(page: number, limit: number): Promise<{ rows: AdminSubscriptionRecord[]; total: number }> {
    const offset = (page - 1) * limit;
    const countResult = await this.db.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM subscriptions`
    );
    const rows = await this.db.query<AdminSubscriptionRecord>(
      `
      SELECT
        s.tenant_id,
        t.name AS tenant_name,
        trim(s.status::text) AS status,
        p.name AS plan_name,
        p.limits
      FROM subscriptions s
      INNER JOIN tenants t ON t.id = s.tenant_id
      LEFT JOIN plans p ON p.id = s.plan_id
      ORDER BY t.name ASC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );
    return {
      rows: rows.rows,
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  }

  async listTenants(page: number, limit: number): Promise<{ rows: Array<TenantAdminRecord & { billing_status: string | null }>; total: number }> {
    const offset = (page - 1) * limit;
    const countResult = await this.db.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM tenants`
    );
    const rows = await this.db.query<TenantAdminRecord & { billing_status: string | null }>(
      `
      SELECT
        t.id,
        t.name,
        t.slug,
        t.plan,
        t.is_active,
        t.created_at,
        t.updated_at,
        trim(s.status::text) AS billing_status
      FROM tenants t
      LEFT JOIN subscriptions s ON s.tenant_id = t.id
      ORDER BY t.created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );
    return {
      rows: rows.rows,
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  }

  async setTenantActiveState(tenantId: string, isActive: boolean): Promise<boolean> {
    const result = await this.db.query(
      `
      UPDATE tenants
      SET is_active = $2, updated_at = NOW()
      WHERE id = $1
      `,
      [tenantId, isActive]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async listUsers(page: number, limit: number): Promise<{ rows: AdminUserRecord[]; total: number }> {
    const offset = (page - 1) * limit;
    const countResult = await this.db.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM users`
    );
    const caps = await getAuthSchemaCaps(this.db);
    const tenantRoleJoin = caps.tenantUsersTable
      ? `LEFT JOIN tenant_users tu ON tu.user_id = u.id AND tu.tenant_id = u.tenant_id`
      : '';
    const tenantRoleSelect = caps.tenantUsersTable ? `tu.role::text AS tenant_role` : `NULL::text AS tenant_role`;
    const rows = await this.db.query<AdminUserRecord>(
      `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        COALESCE(u.system_role::text, 'user') AS system_role,
        u.role::text AS role,
        ${tenantRoleSelect},
        u.tenant_id,
        t.name AS tenant_name,
        u.is_active
      FROM users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
      ${tenantRoleJoin}
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );
    return {
      rows: rows.rows,
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  }

  async updateUserRole(userId: string, role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'): Promise<boolean> {
    const result = await this.db.query(
      `
      UPDATE users
      SET role = $2, updated_at = NOW()
      WHERE id = $1
      `,
      [userId, role]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async upsertTenantRoleForUser(userId: string, tenantId: string | null, role: 'owner' | 'manager' | 'employee'): Promise<void> {
    if (!tenantId) return;
    const caps = await getAuthSchemaCaps(this.db);
    if (!caps.tenantUsersTable) return;
    await this.db.query(
      `
      INSERT INTO tenant_users (user_id, tenant_id, role, created_at, updated_at)
      VALUES ($1, $2, $3::tenant_membership_role, NOW(), NOW())
      ON CONFLICT (user_id, tenant_id)
      DO UPDATE SET role = EXCLUDED.role, updated_at = NOW()
      `,
      [userId, tenantId, role]
    );
  }

  async banUser(userId: string): Promise<boolean> {
    const result = await this.db.query(
      `
      UPDATE users
      SET is_active = FALSE, updated_at = NOW()
      WHERE id = $1
      `,
      [userId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async getUserById(userId: string): Promise<{ id: string; tenant_id: string | null; system_role: string } | null> {
    const result = await this.db.query<{ id: string; tenant_id: string | null; system_role: string }>(
      `
      SELECT id, tenant_id, COALESCE(system_role::text, 'user') AS system_role
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [userId]
    );
    return result.rows[0] ?? null;
  }

  async getDashboardStats(): Promise<{
    total_tenants: number;
    active_subscriptions: number;
    pending_payments: number;
    mrr: number;
  }> {
    const result = await this.db.query<{
      total_tenants: string;
      active_subscriptions: string;
      pending_payments: string;
      mrr: string;
    }>(
      `
      SELECT
        (SELECT COUNT(*)::text FROM tenants) AS total_tenants,
        (SELECT COUNT(*)::text FROM subscriptions WHERE trim(status::text) IN ('active', 'trial')) AS active_subscriptions,
        (SELECT COUNT(*)::text FROM payment_requests WHERE status = 'pending') AS pending_payments,
        (
          SELECT COALESCE(SUM(
            COALESCE(
              NULLIF((to_jsonb(p)->>'price'), '')::numeric,
              CASE lower(p.name)
                WHEN 'basic' THEN 5
                WHEN 'pro' THEN 10
                WHEN 'business' THEN 50
                WHEN 'enterprise' THEN 200
                ELSE 0
              END
            )
          ), 0)::text
          FROM subscriptions s
          LEFT JOIN plans p ON p.id = s.plan_id
          WHERE trim(s.status::text) IN ('active', 'trial')
        ) AS mrr
      `
    );
    return {
      total_tenants: Number(result.rows[0]?.total_tenants ?? 0),
      active_subscriptions: Number(result.rows[0]?.active_subscriptions ?? 0),
      pending_payments: Number(result.rows[0]?.pending_payments ?? 0),
      mrr: Number(result.rows[0]?.mrr ?? 0),
    };
  }
}
