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

  /**
   * Tenant-scoped listing: returns at most the single tenant row for the caller's tenant.
   * No cross-tenant table scans.
   */
  async findAllForTenant(tenantId: string): Promise<TenantRecord[]> {
    const row = await this.findActiveById(tenantId);
    return row ? [row] : [];
  }

  async findPaginatedForTenant(
    tenantId: string,
    _page: number = 1,
    _limit: number = 20
  ): Promise<TenantRecord[]> {
    return this.findAllForTenant(tenantId);
  }

  async countForTenant(tenantId: string): Promise<number> {
    const row = await this.findActiveById(tenantId);
    return row ? 1 : 0;
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
