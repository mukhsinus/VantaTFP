import { Pool } from 'pg';
import { getBillingSubscriptionCaps } from '../billing/billing-schema-caps.js';

export interface PlatformTenantRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PlatformUserRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  system_role: string;
  tenant_id: string | null;
  tenant_name: string | null;
  is_active: boolean;
  created_at: Date;
}

export interface PlatformSubscriptionRow {
  tenant_id: string;
  tenant_name: string;
  status: string;
  plan_tier: string | null;
  plan_name: string | null;
  max_users: number | null;
}

export class PlatformRepository {
  constructor(private readonly db: Pool) {}

  async listTenants(page: number, limit: number): Promise<{ rows: PlatformTenantRow[]; total: number }> {
    const offset = (page - 1) * limit;
    const countResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM tenants`
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const result = await this.db.query<PlatformTenantRow>(
      `
      SELECT id, name, slug, plan, is_active, created_at, updated_at
      FROM tenants
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    return { rows: result.rows, total };
  }

  async listUsers(page: number, limit: number): Promise<{ rows: PlatformUserRow[]; total: number }> {
    const offset = (page - 1) * limit;
    const countResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM users WHERE is_active = TRUE`
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const result = await this.db.query<PlatformUserRow>(
      `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role::text,
        COALESCE(u.system_role::text, 'user') AS system_role,
        u.tenant_id,
        t.name AS tenant_name,
        u.is_active,
        u.created_at
      FROM users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
      WHERE u.is_active = TRUE
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    return { rows: result.rows, total };
  }

  async listSubscriptions(page: number, limit: number): Promise<{ rows: PlatformSubscriptionRow[]; total: number }> {
    const offset = (page - 1) * limit;
    const countResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM subscriptions`
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const caps = await getBillingSubscriptionCaps(this.db);
    const planTierSql = caps.planColumn ? `s.plan::text` : `lower(p.name)`;
    const maxUsersSql = caps.maxUsersColumn ? `s.max_users` : `NULL::integer`;

    const result = await this.db.query<PlatformSubscriptionRow>(
      `
      SELECT
        s.tenant_id,
        t.name AS tenant_name,
        s.status,
        ${planTierSql} AS plan_tier,
        p.name AS plan_name,
        ${maxUsersSql} AS max_users
      FROM subscriptions s
      JOIN tenants t ON t.id = s.tenant_id
      LEFT JOIN plans p ON p.id = s.plan_id
      ORDER BY t.name ASC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    return { rows: result.rows, total };
  }
}
