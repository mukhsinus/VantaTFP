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

export interface UserWithTenantRecord extends UserRecord {
  tenant_name: string;
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
        u.created_at,
        u.updated_at,
        t.name AS tenant_name
      FROM users u
      INNER JOIN tenants t ON t.id = u.tenant_id
      WHERE LOWER(u.email) = LOWER($1)
        AND u.is_active = TRUE
      LIMIT 1
      `,
      [email]
    );

    return result.rows[0] ?? null;
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
