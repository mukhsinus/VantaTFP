import { Pool } from 'pg';
import { enforceTenantScope } from '../../shared/repository/tenant-enforcement.js';

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

  private scoped(sql: string, tenantId: string): string {
    return enforceTenantScope(sql, tenantId);
  }

  async findAllByTenant(tenantId: string): Promise<KpiRecord[]> {
    const result = await this.db.query<KpiRecord>(
      this.scoped(
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
        tenantId
      ),
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
      this.scoped(
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
        tenantId
      ),
      [tenantId, limit, offset]
    );
    return result.rows;
  }

  async countByTenant(tenantId: string): Promise<number> {
    const result = await this.db.query<{ count: string }>(
      this.scoped(
        `
      SELECT COUNT(*) as count
      FROM kpis
      WHERE tenant_id = $1 AND is_active = TRUE
      `,
        tenantId
      ),
      [tenantId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async findByIdAndTenant(kpiId: string, tenantId: string): Promise<KpiRecord | null> {
    const result = await this.db.query<KpiRecord>(
      this.scoped(
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
        tenantId
      ),
      [kpiId, tenantId]
    );
    return result.rows[0] ?? null;
  }

  async findProgressByKpi(kpiId: string, tenantId: string): Promise<KpiProgressRecord[]> {
    const result = await this.db.query<KpiProgressRecord>(
      this.scoped(
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
        tenantId
      ),
      [kpiId, tenantId]
    );
    return result.rows;
  }

  /**
   * Core KPI task metrics (completed in period, on-time vs late completion, performance %).
   * Single assignee — used by cache upsert and `/calculate/:userId`.
   */
  async calculateKpiFromTasks(
    tenantId: string,
    userId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<CalculatedKpiRecord> {
    return this.calculateKpiFromTasksForAssignees(
      tenantId,
      [userId],
      periodStart,
      periodEnd
    );
  }

  /**
   * Same calculation as {@link calculateKpiFromTasks}, pooled across assignees (one query).
   */
  async calculateKpiFromTasksForAssignees(
    tenantId: string,
    assigneeIds: string[],
    periodStart: Date,
    periodEnd: Date
  ): Promise<CalculatedKpiRecord> {
    if (assigneeIds.length === 0) {
      return {
        tasks_completed: 0,
        tasks_on_time: 0,
        tasks_overdue: 0,
        score: 0,
      };
    }

    const result = await this.db.query<CalculatedKpiRecord>(
      this.scoped(
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
        AND assignee_id = ANY($2::uuid[])
        AND status = 'DONE'
        AND completed_at IS NOT NULL
        AND completed_at >= $3
        AND completed_at <= $4
      `,
        tenantId
      ),
      [tenantId, assigneeIds, periodStart, periodEnd]
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

  /**
   * Tasks still open at period end with deadline before period end (pro analytics; does not affect score).
   */
  async countOpenOverdueTasksForAssignees(
    tenantId: string,
    assigneeIds: string[],
    periodEnd: Date
  ): Promise<number> {
    if (assigneeIds.length === 0) {
      return 0;
    }

    const result = await this.db.query<{ n: string }>(
      this.scoped(
        `
      SELECT COUNT(*)::text AS n
      FROM tasks
      WHERE tenant_id = $1
        AND assignee_id = ANY($2::uuid[])
        AND status <> 'DONE'
        AND deadline IS NOT NULL
        AND (COALESCE(is_overdue, FALSE) = TRUE OR deadline < $3)
      `,
        tenantId
      ),
      [tenantId, assigneeIds, periodEnd]
    );

    return Number(result.rows[0]?.n ?? 0);
  }

  async countOpenOverdueTasksGroupedByAssignee(
    tenantId: string,
    assigneeIds: string[],
    periodEnd: Date
  ): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (assigneeIds.length === 0) {
      return map;
    }

    const result = await this.db.query<{ assignee_id: string; n: string }>(
      this.scoped(
        `
      SELECT assignee_id, COUNT(*)::text AS n
      FROM tasks
      WHERE tenant_id = $1
        AND assignee_id = ANY($2::uuid[])
        AND status <> 'DONE'
        AND deadline IS NOT NULL
        AND (COALESCE(is_overdue, FALSE) = TRUE OR deadline < $3)
      GROUP BY assignee_id
      `,
        tenantId
      ),
      [tenantId, assigneeIds, periodEnd]
    );

    for (const row of result.rows) {
      map.set(row.assignee_id, Number(row.n));
    }
    return map;
  }

  async isDirectReport(
    tenantId: string,
    managerId: string,
    userId: string
  ): Promise<boolean> {
    const result = await this.db.query<{ ok: boolean }>(
      this.scoped(
        `
      SELECT EXISTS(
        SELECT 1
        FROM users
        WHERE tenant_id = $1
          AND id = $2
          AND manager_id = $3
          AND is_active = TRUE
      ) AS ok
      `,
        tenantId
      ),
      [tenantId, userId, managerId]
    );
    return Boolean(result.rows[0]?.ok);
  }

  async resolveAnalyticsAssigneeIds(params: {
    tenantId: string;
    userId?: string;
    teamId?: string;
  }): Promise<string[]> {
    if (params.userId && params.teamId) {
      const result = await this.db.query<{ id: string }>(
        this.scoped(
          `
        SELECT u.id
        FROM users u
        WHERE u.tenant_id = $1
          AND u.id = $2
          AND u.manager_id = $3
          AND u.is_active = TRUE
        LIMIT 1
        `,
          params.tenantId
        ),
        [params.tenantId, params.userId, params.teamId]
      );
      return result.rows[0] ? [result.rows[0].id] : [];
    }

    if (params.userId) {
      const result = await this.db.query<{ id: string }>(
        this.scoped(
          `
        SELECT id
        FROM users
        WHERE tenant_id = $1
          AND id = $2
          AND is_active = TRUE
        LIMIT 1
        `,
          params.tenantId
        ),
        [params.tenantId, params.userId]
      );
      return result.rows[0] ? [result.rows[0].id] : [];
    }

    if (params.teamId) {
      const result = await this.db.query<{ id: string }>(
        this.scoped(
          `
        SELECT u.id
        FROM users u
        INNER JOIN users m ON m.id = u.manager_id AND m.tenant_id = u.tenant_id
        WHERE u.tenant_id = $1
          AND u.manager_id = $2
          AND u.is_active = TRUE
          AND m.is_active = TRUE
        ORDER BY u.created_at ASC
        `,
          params.tenantId
        ),
        [params.tenantId, params.teamId]
      );
      return result.rows.map((r) => r.id);
    }

    const result = await this.db.query<{ id: string }>(
      this.scoped(
        `
      SELECT id
      FROM users
      WHERE tenant_id = $1
        AND is_active = TRUE
      ORDER BY created_at ASC
      `,
        params.tenantId
      ),
      [params.tenantId]
    );
    return result.rows.map((r) => r.id);
  }

  async findKpiRecordsForUsersAndPeriod(
    tenantId: string,
    userIds: string[],
    periodStart: Date,
    periodEnd: Date
  ): Promise<KpiRecordCacheRow[]> {
    if (userIds.length === 0) {
      return [];
    }

    const result = await this.db.query<KpiRecordCacheRow>(
      this.scoped(
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
        AND user_id = ANY($2::uuid[])
        AND period_start = $3
        AND period_end = $4
      `,
        tenantId
      ),
      [tenantId, userIds, periodStart, periodEnd]
    );

    return result.rows;
  }

  async upsertKpiRecordCache(params: {
    tenantId: string;
    userId: string;
    periodStart: Date;
    periodEnd: Date;
    calculated: CalculatedKpiRecord;
  }): Promise<KpiRecordCacheRow> {
    const result = await this.db.query<KpiRecordCacheRow>(
      this.scoped(
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
        params.tenantId
      ),
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
      this.scoped(
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
        tenantId
      ),
      [tenantId, userId, periodStart, periodEnd]
    );

    return result.rows[0] ?? null;
  }
}
