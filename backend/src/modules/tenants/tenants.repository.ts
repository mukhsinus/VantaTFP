import { Pool } from 'pg';

export interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class TenantsRepository {
  constructor(private readonly db: Pool) {}

  async findActiveById(tenantId: string): Promise<TenantRecord | null> {
    const result = await this.db.query<TenantRecord>(
      `
      SELECT id, name, slug, plan, is_active, created_at, updated_at
      FROM tenants
      WHERE id = $1
        AND is_active = TRUE
      LIMIT 1
      `,
      [tenantId]
    );
    return result.rows[0] ?? null;
  }

  async findAll(): Promise<TenantRecord[]> {
    const result = await this.db.query<TenantRecord>(
      `
      SELECT id, name, slug, plan, is_active, created_at, updated_at
      FROM tenants
      WHERE is_active = TRUE
      ORDER BY created_at DESC
      `
    );
    return result.rows;
  }

  async findAllPaginated(
    page: number = 1,
    limit: number = 20
  ): Promise<TenantRecord[]> {
    const offset = (page - 1) * limit;
    const result = await this.db.query<TenantRecord>(
      `
      SELECT id, name, slug, plan, is_active, created_at, updated_at
      FROM tenants
      WHERE is_active = TRUE
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );
    return result.rows;
  }

  async count(): Promise<number> {
    const result = await this.db.query<{ count: string }>(
      `
      SELECT COUNT(*) as count
      FROM tenants
      WHERE is_active = TRUE
      `
    );
    return parseInt(result.rows[0].count, 10);
  }

  async findById(tenantId: string): Promise<TenantRecord | null> {
    const result = await this.db.query<TenantRecord>(
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

  async findBySlug(slug: string): Promise<TenantRecord | null> {
    const result = await this.db.query<TenantRecord>(
      `
      SELECT id, name, slug, plan, is_active, created_at, updated_at
      FROM tenants
      WHERE slug = $1 AND is_active = TRUE
      LIMIT 1
      `,
      [slug]
    );
    return result.rows[0] ?? null;
  }

  async create(data: Omit<TenantRecord, 'id' | 'created_at' | 'updated_at'>): Promise<TenantRecord> {
    const result = await this.db.query<TenantRecord>(
      `
      INSERT INTO tenants (id, name, slug, plan, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
      RETURNING id, name, slug, plan, is_active, created_at, updated_at
      `,
      [data.name, data.slug, data.plan, data.is_active]
    );
    return result.rows[0];
  }

  async update(
    tenantId: string,
    data: Partial<Pick<TenantRecord, 'name' | 'plan'>>
  ): Promise<TenantRecord> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }

    if (data.plan !== undefined) {
      updates.push(`plan = $${paramIndex++}`);
      values.push(data.plan);
    }

    updates.push(`updated_at = NOW()`);
    values.push(tenantId);

    if (updates.length === 1) {
      // Only updated_at was set
      const result = await this.db.query<TenantRecord>(
        `
        UPDATE tenants
        SET updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, slug, plan, is_active, created_at, updated_at
        `,
        [tenantId]
      );
      return result.rows[0];
    }

    const query = `
      UPDATE tenants
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, slug, plan, is_active, created_at, updated_at
    `;

    const result = await this.db.query<TenantRecord>(query, values);
    return result.rows[0];
  }

  async deactivate(tenantId: string): Promise<void> {
    await this.db.query(
      `
      UPDATE tenants
      SET is_active = FALSE, updated_at = NOW()
      WHERE id = $1
      `,
      [tenantId]
    );
  }
}
