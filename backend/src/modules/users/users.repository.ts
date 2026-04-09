import { Pool, PoolClient } from 'pg';
import { getAuthSchemaCaps } from '../auth/auth-schema-caps.js';

export interface UserRecord {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  manager_id: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class UsersRepository {
  constructor(private readonly db: Pool) {}

  async findAllActiveByTenant(tenantId: string): Promise<UserRecord[]> {
    const caps = await getAuthSchemaCaps(this.db);
    const systemRoleSql = caps.usersSystemRoleColumn
      ? `COALESCE(system_role::text, 'user')`
      : `'user'::text`;
    const result = await this.db.query<UserRecord>(
      `
      SELECT
        id,
        tenant_id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        manager_id,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE tenant_id = $1
        AND is_active = TRUE
        AND ${systemRoleSql} IS DISTINCT FROM 'super_admin'
      ORDER BY created_at DESC
      `,
      [tenantId]
    );

    return result.rows;
  }

  async findAllActiveByTenantPaginated(
    tenantId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<UserRecord[]> {
    const caps = await getAuthSchemaCaps(this.db);
    const systemRoleSql = caps.usersSystemRoleColumn
      ? `COALESCE(system_role::text, 'user')`
      : `'user'::text`;
    const offset = (page - 1) * limit;
    const result = await this.db.query<UserRecord>(
      `
      SELECT
        id,
        tenant_id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        manager_id,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE tenant_id = $1
        AND is_active = TRUE
        AND ${systemRoleSql} IS DISTINCT FROM 'super_admin'
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [tenantId, limit, offset]
    );

    return result.rows;
  }

  async countActiveByTenant(tenantId: string): Promise<number> {
    const caps = await getAuthSchemaCaps(this.db);
    const systemRoleSql = caps.usersSystemRoleColumn
      ? `COALESCE(system_role::text, 'user')`
      : `'user'::text`;
    const result = await this.db.query<{ count: string }>(
      `
      SELECT COUNT(*) as count
      FROM users
      WHERE tenant_id = $1
        AND is_active = TRUE
        AND ${systemRoleSql} IS DISTINCT FROM 'super_admin'
      `,
      [tenantId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async findByIdAndTenant(userId: string, tenantId: string): Promise<UserRecord | null> {
    const result = await this.db.query<UserRecord>(
      `
      SELECT
        id,
        tenant_id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        manager_id,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
        AND tenant_id = $2
      LIMIT 1
      `,
      [userId, tenantId]
    );

    return result.rows[0] ?? null;
  }

  async findByEmail(email: string, tenantId?: string): Promise<UserRecord | null> {
    const values: string[] = [email];
    let whereClause = 'LOWER(email) = LOWER($1)';

    if (tenantId) {
      values.push(tenantId);
      whereClause += ' AND tenant_id = $2';
    }

    const result = await this.db.query<UserRecord>(
      `
      SELECT
        id,
        tenant_id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        manager_id,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE ${whereClause}
      LIMIT 1
      `,
      values
    );

    return result.rows[0] ?? null;
  }

  async create(
    data: Omit<UserRecord, 'id' | 'created_at' | 'updated_at'>,
    executor: Pick<Pool, 'query'> | Pick<PoolClient, 'query'> = this.db
  ): Promise<UserRecord> {
    const result = await executor.query<UserRecord>(
      `
      INSERT INTO users (
        id,
        tenant_id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        manager_id,
        is_active,
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
        TRUE,
        NOW(),
        NOW()
      )
      RETURNING
        id,
        tenant_id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        manager_id,
        is_active,
        created_at,
        updated_at
      `,
      [
        data.tenant_id,
        data.email,
        data.password_hash,
        data.first_name,
        data.last_name,
        data.role,
        data.manager_id,
      ]
    );

    return result.rows[0];
  }

  async update(
    userId: string,
    tenantId: string,
    data: Partial<
      Pick<UserRecord, 'email' | 'first_name' | 'last_name' | 'role' | 'manager_id'>
    >
  ): Promise<UserRecord> {
    const fields: string[] = [];
    const values: Array<string | null> = [];
    let paramIndex = 1;

    if (data.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }

    if (data.first_name !== undefined) {
      fields.push(`first_name = $${paramIndex++}`);
      values.push(data.first_name);
    }

    if (data.last_name !== undefined) {
      fields.push(`last_name = $${paramIndex++}`);
      values.push(data.last_name);
    }

    if (data.role !== undefined) {
      fields.push(`role = $${paramIndex++}`);
      values.push(data.role);
    }

    if (data.manager_id !== undefined) {
      fields.push(`manager_id = $${paramIndex++}`);
      values.push(data.manager_id);
    }

    if (fields.length === 0) {
      const existing = await this.findByIdAndTenant(userId, tenantId);
      if (!existing) {
        throw new Error('User not found after update');
      }
      return existing;
    }

    fields.push(`updated_at = NOW()`);

    values.push(userId, tenantId);

    const result = await this.db.query<UserRecord>(
      `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex++}
        AND tenant_id = $${paramIndex}
        AND is_active = TRUE
      RETURNING
        id,
        tenant_id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        manager_id,
        is_active,
        created_at,
        updated_at
      `,
      values
    );

    if (!result.rows[0]) {
      throw new Error('User not found after update');
    }

    return result.rows[0];
  }

  async deactivate(userId: string, tenantId: string): Promise<boolean> {
    const result = await this.db.query(
      `
      UPDATE users
      SET is_active = FALSE, updated_at = NOW()
      WHERE id = $1
        AND tenant_id = $2
        AND is_active = TRUE
      `,
      [userId, tenantId]
    );

    return (result.rowCount ?? 0) > 0;
  }

  /** Session profile for GET /users/me (any active user, including platform super_admin). */
  async findMeProfile(userId: string): Promise<{
    id: string;
    tenant_id: string | null;
    email: string;
    first_name: string;
    last_name: string;
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
    system_role: string;
    tenant_name: string | null;
  } | null> {
    const caps = await getAuthSchemaCaps(this.db);
    const systemRoleSql = caps.usersSystemRoleColumn
      ? `COALESCE(u.system_role::text, 'user')`
      : `'user'::text`;

    const result = await this.db.query<{
      id: string;
      tenant_id: string | null;
      email: string;
      first_name: string;
      last_name: string;
      role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
      system_role: string;
      tenant_name: string | null;
    }>(
      `
      SELECT
        u.id,
        u.tenant_id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        ${systemRoleSql} AS system_role,
        t.name AS tenant_name
      FROM users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
      WHERE u.id = $1::uuid
        AND u.is_active = TRUE
      LIMIT 1
      `,
      [userId]
    );

    return result.rows[0] ?? null;
  }
}
