import { Pool } from 'pg';

export interface UserRecord {
  id: string;
  tenant_id: string;
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
  tenant_plan?: string | null;
  is_super_admin?: boolean;
}

export class AuthRepository {
  constructor(private readonly db: Pool) {}

  async findUserByEmail(email: string): Promise<UserWithTenantRecord | null> {
    const result = await this.db.query<UserWithTenantRecord>(
      `
      SELECT
        u.id,
        u.tenant_id,
        u.email,
        u.password_hash,
        u.first_name,
        u.last_name,
        u.role,
        u.is_active,
        u.is_super_admin,
        u.created_at,
        u.updated_at,
        t.name AS tenant_name,
        t.plan AS tenant_plan
      FROM users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
      WHERE LOWER(u.email) = LOWER($1)
        AND u.is_active = TRUE
      LIMIT 1
      `,
      [email]
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

  async findUserById(userId: string): Promise<UserRecord | null> {
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
      WHERE id = $1 AND is_active = TRUE
      LIMIT 1
      `,
      [userId]
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

  async markInviteAsUsed(inviteId: string, userId: string): Promise<void> {
    await this.db.query(
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
    data: Omit<UserRecord, 'id' | 'created_at' | 'updated_at'>
  ): Promise<UserRecord> {
    const result = await this.db.query<UserRecord>(
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
