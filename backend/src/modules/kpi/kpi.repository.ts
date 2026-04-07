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

export interface CalculatedKpiRecord {
  tasks_completed: number;
  tasks_on_time: number;
  tasks_overdue: number;
  score: number;
}

export interface KpiRecordCacheRow {
  id: string;
  tenant_id: string;
  user_id: string;
  period_start: Date;
  period_end: Date;
  tasks_completed: number;
  tasks_on_time: number;
  tasks_overdue: number;
  score: number;
  created_at: Date;
  updated_at: Date;
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

  async calculateKpiFromTasks(
    tenantId: string,
    userId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<CalculatedKpiRecord> {
    const result = await this.db.query<CalculatedKpiRecord>(
      `
      SELECT
        COUNT(*)::int AS tasks_completed,
        COUNT(*) FILTER (
          WHERE deadline IS NOT NULL
            AND completed_at <= deadline
        )::int AS tasks_on_time,
        COUNT(*) FILTER (
          WHERE deadline IS NOT NULL
            AND completed_at > deadline
        )::int AS tasks_overdue,
        CASE
          WHEN COUNT(*) = 0 THEN 0::double precision
          ELSE ROUND(
            (
              COUNT(*) FILTER (
                WHERE deadline IS NOT NULL
                  AND completed_at <= deadline
              )::numeric
              / COUNT(*)::numeric
            ) * 100,
            2
          )::double precision
        END AS score
      FROM tasks
      WHERE tenant_id = $1
        AND assignee_id = $2
        AND status = 'DONE'
        AND completed_at IS NOT NULL
        AND completed_at >= $3
        AND completed_at <= $4
      `,
      [tenantId, userId, periodStart, periodEnd]
    );

    return (
      result.rows[0] ?? {
        tasks_completed: 0,
        tasks_on_time: 0,
        tasks_overdue: 0,
        score: 0,
      }
    );
  }

  async upsertKpiRecordCache(params: {
    tenantId: string;
    userId: string;
    periodStart: Date;
    periodEnd: Date;
    calculated: CalculatedKpiRecord;
  }): Promise<KpiRecordCacheRow> {
    const result = await this.db.query<KpiRecordCacheRow>(
      `
      INSERT INTO kpi_records (
        id,
        tenant_id,
        user_id,
        period_start,
        period_end,
        tasks_completed,
        tasks_on_time,
        tasks_overdue,
        score,
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
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id, period_start, period_end)
      DO UPDATE SET
        tasks_completed = EXCLUDED.tasks_completed,
        tasks_on_time = EXCLUDED.tasks_on_time,
        tasks_overdue = EXCLUDED.tasks_overdue,
        score = EXCLUDED.score,
        tenant_id = EXCLUDED.tenant_id,
        updated_at = NOW()
      RETURNING
        id,
        tenant_id,
        user_id,
        period_start,
        period_end,
        tasks_completed,
        tasks_on_time,
        tasks_overdue,
        score,
        created_at,
        updated_at
      `,
      [
        params.tenantId,
        params.userId,
        params.periodStart,
        params.periodEnd,
        params.calculated.tasks_completed,
        params.calculated.tasks_on_time,
        params.calculated.tasks_overdue,
        params.calculated.score,
      ]
    );

    return result.rows[0];
  }

  async findKpiRecordByUserAndPeriod(
    tenantId: string,
    userId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<KpiRecordCacheRow | null> {
    const result = await this.db.query<KpiRecordCacheRow>(
      `
      SELECT
        id,
        tenant_id,
        user_id,
        period_start,
        period_end,
        tasks_completed,
        tasks_on_time,
        tasks_overdue,
        score,
        created_at,
        updated_at
      FROM kpi_records
      WHERE tenant_id = $1
        AND user_id = $2
        AND period_start = $3
        AND period_end = $4
      LIMIT 1
      `,
      [tenantId, userId, periodStart, periodEnd]
    );

    return result.rows[0] ?? null;
  }
}
