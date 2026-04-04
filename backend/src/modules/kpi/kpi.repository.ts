import { Pool } from 'pg';

export interface KpiRecord {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  target_value: number;
  unit: string;
  period: string;
  assignee_id: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface KpiProgressRecord {
  id: string;
  kpi_id: string;
  tenant_id: string;
  actual_value: number;
  recorded_at: Date;
  notes: string | null;
  created_at: Date;
}

export class KpiRepository {
  constructor(private readonly db: Pool) {}

  async findAllByTenant(tenantId: string): Promise<KpiRecord[]> {
    const result = await this.db.query<KpiRecord>(
      `
      SELECT
        id,
        tenant_id,
        name,
        description,
        target_value,
        unit,
        period,
        assignee_id,
        created_by,
        created_at,
        updated_at
      FROM kpis
      WHERE tenant_id = $1 AND is_active = TRUE
      ORDER BY created_at DESC
      `,
      [tenantId]
    );
    return result.rows;
  }

  async findAllByTenantPaginated(
    tenantId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<KpiRecord[]> {
    const offset = (page - 1) * limit;
    const result = await this.db.query<KpiRecord>(
      `
      SELECT
        id,
        tenant_id,
        name,
        description,
        target_value,
        unit,
        period,
        assignee_id,
        created_by,
        created_at,
        updated_at
      FROM kpis
      WHERE tenant_id = $1 AND is_active = TRUE
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [tenantId, limit, offset]
    );
    return result.rows;
  }

  async countByTenant(tenantId: string): Promise<number> {
    const result = await this.db.query<{ count: string }>(
      `
      SELECT COUNT(*) as count
      FROM kpis
      WHERE tenant_id = $1 AND is_active = TRUE
      `,
      [tenantId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async findByIdAndTenant(kpiId: string, tenantId: string): Promise<KpiRecord | null> {
    const result = await this.db.query<KpiRecord>(
      `
      SELECT
        id,
        tenant_id,
        name,
        description,
        target_value,
        unit,
        period,
        assignee_id,
        created_by,
        created_at,
        updated_at
      FROM kpis
      WHERE id = $1 AND tenant_id = $2 AND is_active = TRUE
      LIMIT 1
      `,
      [kpiId, tenantId]
    );
    return result.rows[0] ?? null;
  }

  async create(data: Omit<KpiRecord, 'id' | 'created_at' | 'updated_at'>): Promise<KpiRecord> {
    const result = await this.db.query<KpiRecord>(
      `
      INSERT INTO kpis (
        id,
        tenant_id,
        name,
        description,
        target_value,
        unit,
        period,
        assignee_id,
        created_by,
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
        $8,
        TRUE,
        NOW(),
        NOW()
      )
      RETURNING
        id,
        tenant_id,
        name,
        description,
        target_value,
        unit,
        period,
        assignee_id,
        created_by,
        created_at,
        updated_at
      `,
      [
        data.tenant_id,
        data.name,
        data.description,
        data.target_value,
        data.unit,
        data.period,
        data.assignee_id,
        data.created_by,
      ]
    );
    return result.rows[0];
  }

  async update(
    kpiId: string,
    tenantId: string,
    data: Partial<Pick<KpiRecord, 'name' | 'description' | 'target_value' | 'unit' | 'period'>>
  ): Promise<KpiRecord> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.target_value !== undefined) {
      updates.push(`target_value = $${paramIndex++}`);
      values.push(data.target_value);
    }
    if (data.unit !== undefined) {
      updates.push(`unit = $${paramIndex++}`);
      values.push(data.unit);
    }
    if (data.period !== undefined) {
      updates.push(`period = $${paramIndex++}`);
      values.push(data.period);
    }

    updates.push(`updated_at = NOW()`);
    values.push(kpiId);
    values.push(tenantId);

    const query = `
      UPDATE kpis
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex + 1} AND tenant_id = $${paramIndex + 2}
      RETURNING
        id,
        tenant_id,
        name,
        description,
        target_value,
        unit,
        period,
        assignee_id,
        created_by,
        created_at,
        updated_at
    `;

    const result = await this.db.query<KpiRecord>(query, values);
    return result.rows[0];
  }

  async delete(kpiId: string, tenantId: string): Promise<void> {
    await this.db.query(
      `
      UPDATE kpis
      SET is_active = FALSE, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      `,
      [kpiId, tenantId]
    );
  }

  async recordProgress(
    data: Omit<KpiProgressRecord, 'id' | 'created_at'>
  ): Promise<KpiProgressRecord> {
    const result = await this.db.query<KpiProgressRecord>(
      `
      INSERT INTO kpi_progress (
        id,
        kpi_id,
        tenant_id,
        actual_value,
        recorded_at,
        notes,
        created_at
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4,
        $5,
        NOW()
      )
      RETURNING
        id,
        kpi_id,
        tenant_id,
        actual_value,
        recorded_at,
        notes,
        created_at
      `,
      [
        data.kpi_id,
        data.tenant_id,
        data.actual_value,
        data.recorded_at ?? new Date(),
        data.notes,
      ]
    );
    return result.rows[0];
  }

  async findProgressByKpi(kpiId: string, tenantId: string): Promise<KpiProgressRecord[]> {
    const result = await this.db.query<KpiProgressRecord>(
      `
      SELECT
        id,
        kpi_id,
        tenant_id,
        actual_value,
        recorded_at,
        notes,
        created_at
      FROM kpi_progress
      WHERE kpi_id = $1 AND tenant_id = $2
      ORDER BY recorded_at DESC
      `,
      [kpiId, tenantId]
    );
    return result.rows;
  }
}
