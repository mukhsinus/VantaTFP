import { Pool, PoolClient } from 'pg';
import type { AuthContextRow } from '../../shared/auth/principal.js';
import { getAuthSchemaCaps } from './auth-schema-caps.js';

export interface UserRecord {
  id: string;
  tenant_id: string | null;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TenantInviteRecord {
  id: string;
  tenant_id: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  token: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  used_by_user_id: string | null;
  created_by_user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithTenantRecord extends UserRecord {
  tenant_name: string | null;
  system_role: string;
  tenant_membership_role: string | null;
}

export class AuthRepository {
  constructor(private readonly db: Pool) {}

  async findUserByPhone(phone: string): Promise<UserWithTenantRecord | null> {
    const caps = await getAuthSchemaCaps(this.db);
    const useTenantUsers = caps.tenantUsersTable;
    const systemRoleSql = caps.usersSystemRoleColumn
      ? `COALESCE(u.system_role::text, 'user')`
      : `'user'::text`;

    const sql = useTenantUsers
      ? `
      SELECT
        u.id,
        u.tenant_id,
        u.email,
        u.password_hash,
        u.first_name,
        u.last_name,
        u.role,
        u.is_active,
        u.created_at,
        u.updated_at,
        ${systemRoleSql} AS system_role,
        t.name AS tenant_name,
        tu.role::text AS tenant_membership_role
      FROM users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
      LEFT JOIN tenant_users tu ON tu.user_id = u.id AND tu.tenant_id = u.tenant_id
      WHERE u.phone = $1
        AND u.is_active = TRUE
      LIMIT 1
      `
      : `
      SELECT
        u.id,
        u.tenant_id,
        u.email,
        u.password_hash,
        u.first_name,
        u.last_name,
        u.role,
        u.is_active,
        u.created_at,
        u.updated_at,
        ${systemRoleSql} AS system_role,
        t.name AS tenant_name,
        NULL::text AS tenant_membership_role
      FROM users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
      WHERE u.phone = $1
        AND u.is_active = TRUE
      LIMIT 1
      `;

    const result = await this.db.query<UserWithTenantRecord>(sql, [phone]);
    return result.rows[0] ?? null;
  }

  /** Create a tenant + owner user + trial subscription atomically (employer self-registration). */
  async createEmployerWithTenant(data: {
    companyName: string;
    slug: string;
    ownerName: string;
    email: string | null;
    phone: string | null;
    passwordHash: string;
  }): Promise<{ tenantId: string; userId: string }> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const tenantResult = await client.query<{ id: string }>(
        `
        INSERT INTO tenants (id, name, slug, plan, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, 'FREE', TRUE, NOW(), NOW())
        RETURNING id
        `,
        [data.companyName, data.slug]
      );
      const tenantId = tenantResult.rows[0].id;

      const caps = await getAuthSchemaCaps(this.db);

      const nameParts = data.ownerName.trim().split(/\s+/);
      const firstName = nameParts[0] ?? 'Owner';
      const lastName = nameParts.slice(1).join(' ') || 'Account';

      let userResult: { rows: Array<{ id: string }> };
      if (caps.usersSystemRoleColumn) {
        userResult = await client.query<{ id: string }>(
          `
          INSERT INTO users (
            id, tenant_id, email, phone, first_name, last_name, role,
            system_role, is_active, created_at, updated_at
          )
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'ADMIN', 'user', TRUE, NOW(), NOW())
          RETURNING id
          `,
          [tenantId, data.email, data.phone, firstName, lastName]
        );
      } else {
        userResult = await client.query<{ id: string }>(
          `
          INSERT INTO users (
            id, tenant_id, email, phone, first_name, last_name, role,
            is_active, created_at, updated_at
          )
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'ADMIN', TRUE, NOW(), NOW())
          RETURNING id
          `,
          [tenantId, data.email, data.phone, firstName, lastName]
        );
      }
      const userId = userResult.rows[0].id;

      await client.query(
        `
        UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2
        `,
        [data.passwordHash, userId]
      );

      if (caps.tenantUsersTable) {
        await client.query(
          `
          INSERT INTO tenant_users (user_id, tenant_id, role, created_at, updated_at)
          VALUES ($1::uuid, $2::uuid, 'owner'::tenant_membership_role, NOW(), NOW())
          ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = 'owner', updated_at = NOW()
          `,
          [userId, tenantId]
        );
      }

      await client.query('COMMIT');
      return { tenantId, userId };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findUserByEmail(email: string): Promise<UserWithTenantRecord | null> {
    const caps = await getAuthSchemaCaps(this.db);
    const useTenantUsers = caps.tenantUsersTable;
    const systemRoleSql = caps.usersSystemRoleColumn
      ? `COALESCE(u.system_role::text, 'user')`
      : `'user'::text`;

    const sql = useTenantUsers
      ? `
      SELECT
        u.id,
        u.tenant_id,
        u.email,
        u.password_hash,
        u.first_name,
        u.last_name,
        u.role,
        u.is_active,
        u.created_at,
        u.updated_at,
        ${systemRoleSql} AS system_role,
        t.name AS tenant_name,
        tu.role::text AS tenant_membership_role
      FROM users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
      LEFT JOIN tenant_users tu ON tu.user_id = u.id AND tu.tenant_id = u.tenant_id
      WHERE LOWER(u.email) = LOWER($1)
        AND u.is_active = TRUE
      LIMIT 1
      `
      : `
      SELECT
        u.id,
        u.tenant_id,
        u.email,
        u.password_hash,
        u.first_name,
        u.last_name,
        u.role,
        u.is_active,
        u.created_at,
        u.updated_at,
        ${systemRoleSql} AS system_role,
        t.name AS tenant_name,
        NULL::text AS tenant_membership_role
      FROM users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
      WHERE LOWER(u.email) = LOWER($1)
        AND u.is_active = TRUE
      LIMIT 1
      `;

    const result = await this.db.query<UserWithTenantRecord>(sql, [email]);
    return result.rows[0] ?? null;
  }

  /**
   * Resolves effective tenant (JWT tenant wins) and membership for auth hydration.
   */
  async findAuthContextById(
    userId: string,
    jwtTenantId: string | null | undefined
  ): Promise<AuthContextRow | null> {
    const caps = await getAuthSchemaCaps(this.db);
    const useTenantUsers = caps.tenantUsersTable;
    const systemRoleSql = caps.usersSystemRoleColumn
      ? `COALESCE(u.system_role::text, 'user')`
      : `'user'::text`;

    const sql = useTenantUsers
      ? `
      SELECT
        u.id,
        u.email,
        ${systemRoleSql} AS system_role,
        u.role::text AS legacy_role,
        u.tenant_id AS user_primary_tenant_id,
        eff.eff_tid AS effective_tenant_id,
        tu.role::text AS membership_role
      FROM users u
      CROSS JOIN LATERAL (
        SELECT COALESCE(
          $2::uuid,
          u.tenant_id,
          (
            SELECT tu0.tenant_id
            FROM tenant_users tu0
            WHERE tu0.user_id = u.id
            ORDER BY tu0.created_at ASC, tu0.id ASC
            LIMIT 1
          )
        ) AS eff_tid
      ) eff
      LEFT JOIN tenant_users tu
        ON tu.user_id = u.id
       AND tu.tenant_id = eff.eff_tid
      WHERE u.id = $1::uuid
        AND u.is_active = TRUE
      LIMIT 1
      `
      : `
      SELECT
        u.id,
        u.email,
        ${systemRoleSql} AS system_role,
        u.role::text AS legacy_role,
        u.tenant_id AS user_primary_tenant_id,
        COALESCE($2::uuid, u.tenant_id) AS effective_tenant_id,
        NULL::text AS membership_role
      FROM users u
      WHERE u.id = $1::uuid
        AND u.is_active = TRUE
      LIMIT 1
      `;

    const result = await this.db.query<AuthContextRow>(sql, [userId, jwtTenantId ?? null]);
    return result.rows[0] ?? null;
  }

  async findActiveUserById(userId: string): Promise<UserRecord | null> {
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
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE id = $1::uuid AND is_active = TRUE
      LIMIT 1
      `,
      [userId]
    );

    return result.rows[0] ?? null;
  }

  async findUserByIdAndTenant(userId: string, tenantId: string): Promise<UserRecord | null> {
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
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE id = $1 AND tenant_id = $2 AND is_active = TRUE
      LIMIT 1
      `,
      [userId, tenantId]
    );

    return result.rows[0] ?? null;
  }

  async findInviteByToken(token: string): Promise<TenantInviteRecord | null> {
    const result = await this.db.query<TenantInviteRecord>(
      `
      SELECT
        id,
        tenant_id,
        email,
        role,
        token,
        token_hash,
        expires_at,
        used_at,
        used_by_user_id,
        created_by_user_id,
        created_at,
        updated_at
      FROM tenant_invites
      WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()
      LIMIT 1
      `,
      [token]
    );

    return result.rows[0] ?? null;
  }

  async markInviteAsUsed(
    inviteId: string,
    userId: string,
    executor: Pick<Pool, 'query'> | Pick<PoolClient, 'query'> = this.db
  ): Promise<void> {
    await executor.query(
      `
      UPDATE tenant_invites
      SET used_at = NOW(), used_by_user_id = $1, updated_at = NOW()
      WHERE id = $2
      `,
      [userId, inviteId]
    );
  }

  async findFirstActiveTenant(): Promise<TenantRecord | null> {
    const result = await this.db.query<TenantRecord>(
      `
      SELECT id, name, slug, plan, is_active, created_at, updated_at
      FROM tenants
      WHERE is_active = TRUE
      ORDER BY created_at ASC
      LIMIT 1
      `
    );

    return result.rows[0] ?? null;
  }

  async createDefaultTenant(name: string, slug: string): Promise<TenantRecord> {
    const result = await this.db.query<TenantRecord>(
      `
      INSERT INTO tenants (id, name, slug, plan, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, 'FREE', TRUE, NOW(), NOW())
      RETURNING id, name, slug, plan, is_active, created_at, updated_at
      `,
      [name, slug]
    );

    return result.rows[0];
  }

  async createUser(
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
        data.is_active,
      ]
    );

    return result.rows[0];
  }
}
