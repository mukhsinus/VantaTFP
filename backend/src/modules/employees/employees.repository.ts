import type { Pool, PoolClient } from 'pg';
import { getAuthSchemaCaps } from '../auth/auth-schema-caps.js';

type Queryable = Pick<Pool, 'query'> | PoolClient;

export type TenantMembershipRole = 'owner' | 'manager' | 'employee';

export interface EmployeeListRow {
  id: string;
  email: string;
  role: TenantMembershipRole;
}

export class EmployeesRepository {
  constructor(private readonly db: Pool) {}

  /**
   * Active tenant members from `users` + `tenant_users`, excluding platform super_admin.
   * Role falls back to legacy `users.role` when `tenant_users` is missing.
   */
  async listByTenant(
    tenantId: string,
    page: number,
    limit: number,
    executor: Queryable = this.db
  ): Promise<EmployeeListRow[]> {
    const offset = (page - 1) * limit;
    const caps = await getAuthSchemaCaps(this.db);
    const systemRoleSql = caps.usersSystemRoleColumn
      ? `COALESCE(u.system_role::text, 'user')`
      : `'user'::text`;

    const sql = caps.tenantUsersTable
      ? `
      SELECT
        u.id,
        u.email,
        (
          COALESCE(
            tu.role::text,
            CASE UPPER(TRIM(u.role::text))
              WHEN 'ADMIN' THEN 'owner'
              WHEN 'MANAGER' THEN 'manager'
              ELSE 'employee'
            END
          )
        )::text AS role
      FROM users u
      LEFT JOIN tenant_users tu
        ON tu.user_id = u.id AND tu.tenant_id = u.tenant_id
      WHERE u.tenant_id = $1
        AND u.is_active = TRUE
        AND ${systemRoleSql} IS DISTINCT FROM 'super_admin'
      ORDER BY u.created_at DESC
      LIMIT $2 OFFSET $3
      `
      : `
      SELECT
        u.id,
        u.email,
        (
          CASE UPPER(TRIM(u.role::text))
            WHEN 'ADMIN' THEN 'owner'
            WHEN 'MANAGER' THEN 'manager'
            ELSE 'employee'
          END
        )::text AS role
      FROM users u
      WHERE u.tenant_id = $1
        AND u.is_active = TRUE
        AND ${systemRoleSql} IS DISTINCT FROM 'super_admin'
      ORDER BY u.created_at DESC
      LIMIT $2 OFFSET $3
      `;

    const result = await executor.query<EmployeeListRow>(sql, [tenantId, limit, offset]);

    return result.rows.map((r) => ({
      ...r,
      role: normalizeTenantRole(r.role),
    }));
  }

  async countByTenant(tenantId: string, executor: Queryable = this.db): Promise<number> {
    const caps = await getAuthSchemaCaps(this.db);
    const systemRoleSql = caps.usersSystemRoleColumn
      ? `COALESCE(u.system_role::text, 'user')`
      : `'user'::text`;

    const result = await executor.query<{ count: string }>(
      `
      SELECT COUNT(*)::text AS count
      FROM users u
      WHERE u.tenant_id = $1
        AND u.is_active = TRUE
        AND ${systemRoleSql} IS DISTINCT FROM 'super_admin'
      `,
      [tenantId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  async getMembershipRole(
    userId: string,
    tenantId: string,
    executor: Queryable = this.db
  ): Promise<TenantMembershipRole | null> {
    const caps = await getAuthSchemaCaps(this.db);

    const sql = caps.tenantUsersTable
      ? `
      SELECT tu.role::text AS role, u.role::text AS legacy
      FROM users u
      LEFT JOIN tenant_users tu
        ON tu.user_id = u.id AND tu.tenant_id = $2
      WHERE u.id = $1::uuid
        AND u.tenant_id = $2
        AND u.is_active = TRUE
      LIMIT 1
      `
      : `
      SELECT NULL::text AS role, u.role::text AS legacy
      FROM users u
      WHERE u.id = $1::uuid
        AND u.tenant_id = $2
        AND u.is_active = TRUE
      LIMIT 1
      `;

    const result = await executor.query<{ role: string | null; legacy: string }>(sql, [
      userId,
      tenantId,
    ]);

    const row = result.rows[0];
    if (!row) return null;
    if (row.role) return normalizeTenantRole(row.role);
    return legacyUserRoleToTenantRole(row.legacy);
  }

  async upsertTenantMembership(
    userId: string,
    tenantId: string,
    role: TenantMembershipRole,
    executor: Queryable = this.db
  ): Promise<void> {
    await executor.query(
      `
      INSERT INTO tenant_users (user_id, tenant_id, role, created_at, updated_at)
      VALUES ($1::uuid, $2::uuid, $3::tenant_membership_role, NOW(), NOW())
      ON CONFLICT (user_id, tenant_id)
      DO UPDATE SET
        role = EXCLUDED.role,
        updated_at = NOW()
      `,
      [userId, tenantId, role]
    );
  }
}

function normalizeTenantRole(raw: string): TenantMembershipRole {
  const r = raw.toLowerCase();
  if (r === 'owner' || r === 'manager' || r === 'employee') return r;
  return legacyUserRoleToTenantRole(raw);
}

function legacyUserRoleToTenantRole(legacy: string): TenantMembershipRole {
  switch (legacy?.toUpperCase()) {
    case 'ADMIN':
      return 'owner';
    case 'MANAGER':
      return 'manager';
    default:
      return 'employee';
  }
}
