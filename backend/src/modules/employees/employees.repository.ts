import type { Pool, PoolClient } from 'pg';
import { ApplicationError } from '../../shared/utils/application-error.js';
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

  async hasPhoneColumn(): Promise<boolean> {
    const caps = await getAuthSchemaCaps(this.db);
    return caps.usersPhoneColumn;
  }

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
        ON tu.user_id = u.id AND tu.tenant_id = $1::uuid
      WHERE u.is_active = TRUE
        AND (u.tenant_id = $1::uuid OR tu.user_id IS NOT NULL)
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

    const countSql = caps.tenantUsersTable
      ? `
      SELECT COUNT(*)::text AS count
      FROM users u
      LEFT JOIN tenant_users tu ON tu.user_id = u.id AND tu.tenant_id = $1::uuid
      WHERE u.is_active = TRUE
        AND (u.tenant_id = $1::uuid OR tu.user_id IS NOT NULL)
        AND ${systemRoleSql} IS DISTINCT FROM 'super_admin'
      `
      : `
      SELECT COUNT(*)::text AS count
      FROM users u
      WHERE u.tenant_id = $1
        AND u.is_active = TRUE
        AND ${systemRoleSql} IS DISTINCT FROM 'super_admin'
      `;

    const result = await executor.query<{ count: string }>(countSql, [tenantId]);
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

  async createEmployee(
    data: {
      tenantId: string;
      phone: string;
      name: string | null;
      roleDescription: string | null;
      passwordHash: string;
      role: 'manager' | 'employee';
    },
    executor: Queryable = this.db
  ): Promise<{ id: string; phone: string; name: string | null; role: TenantMembershipRole }> {
    const caps = await getAuthSchemaCaps(this.db);
    const firstName = data.name ? data.name.split(' ')[0] : 'Employee';
    const lastName = data.name ? data.name.split(' ').slice(1).join(' ') || '' : '';
    const legacyRole = data.role === 'manager' ? 'MANAGER' : 'EMPLOYEE';

    let userResult: { rows: Array<{ id: string }> };
    if (caps.usersSystemRoleColumn) {
      userResult = await executor.query<{ id: string }>(
        `
        INSERT INTO users (
          id, tenant_id, phone, first_name, last_name, role, system_role,
          password_hash, role_description, is_active, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5::text::"user_role_enum",
          'user', $6, $7, TRUE, NOW(), NOW()
        )
        RETURNING id
        `,
        [data.tenantId, data.phone, firstName, lastName, legacyRole, data.passwordHash, data.roleDescription]
      ).catch(async () => {
        return executor.query<{ id: string }>(
          `
          INSERT INTO users (
            id, tenant_id, phone, first_name, last_name, role, system_role,
            password_hash, is_active, created_at, updated_at
          )
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'user', $6, TRUE, NOW(), NOW())
          RETURNING id
          `,
          [data.tenantId, data.phone, firstName, lastName, legacyRole, data.passwordHash]
        );
      });
    } else {
      userResult = await executor.query<{ id: string }>(
        `
        INSERT INTO users (
          id, tenant_id, phone, first_name, last_name, role,
          password_hash, is_active, created_at, updated_at
        )
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, TRUE, NOW(), NOW())
        RETURNING id
        `,
        [data.tenantId, data.phone, firstName, lastName, legacyRole, data.passwordHash]
      );
    }

    const userId = userResult.rows[0].id;

    if (caps.tenantUsersTable) {
      await executor.query(
        `
        INSERT INTO tenant_users (user_id, tenant_id, role, created_at, updated_at)
        VALUES ($1::uuid, $2::uuid, $3::tenant_membership_role, NOW(), NOW())
        ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW()
        `,
        [userId, data.tenantId, data.role]
      );
    }

    return {
      id: userId,
      phone: data.phone,
      name: data.name,
      role: data.role,
    };
  }

  async upsertTenantMembership(
    userId: string,
    tenantId: string,
    role: TenantMembershipRole,
    executor: Queryable = this.db
  ): Promise<void> {
    const caps = await getAuthSchemaCaps(this.db);
    if (caps.usersSystemRoleColumn) {
      const sr = await executor.query<{ s: string }>(
        `
        SELECT COALESCE(system_role::text, 'user') AS s
        FROM users
        WHERE id = $1::uuid
        LIMIT 1
        `,
        [userId]
      );
      if (sr.rows[0]?.s === 'super_admin') {
        throw ApplicationError.forbidden(
          'Platform super administrators cannot be assigned a tenant role'
        );
      }
    }

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
