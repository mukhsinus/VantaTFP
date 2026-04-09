import { Pool } from 'pg';
import type { ListReportHistoryQuery } from './reports.schema.js';
import { enforceTenantScope } from '../../shared/repository/tenant-enforcement.js';

export interface ReportUserRow {
  id: string;
  first_name: string;
  last_name: string;
}

export interface KpiSummaryRow {
  user_id: string;
  tasks_completed: number;
  tasks_on_time: number;
  tasks_overdue: number;
}

export interface PayrollSummaryRow {
  user_id: string;
  base_total: number;
  bonus_total: number;
  total_total: number;
}

export interface TaskSummaryRow {
  user_id: string;
  completed_tasks: number;
  overdue_tasks: number;
}

export interface ReportHistoryRow {
  id: string;
  tenant_id: string;
  report_type: string;
  format: string;
  filters: Record<string, unknown>;
  payload: Record<string, unknown>;
  generated_by: string;
  created_at: Date;
}

export class ReportsRepository {
  constructor(private readonly db: Pool) {}

  private scoped(sql: string, tenantId: string): string {
    return enforceTenantScope(sql, tenantId);
  }

  async resolveAssigneeIds(
    tenantId: string,
    filters: { userId?: string; teamId?: string }
  ): Promise<string[]> {
    if (filters.userId && filters.teamId) {
      const result = await this.db.query<{ id: string }>(
        this.scoped(
          `
        SELECT id
        FROM users
        WHERE tenant_id = $1
          AND id = $2
          AND manager_id = $3
          AND is_active = TRUE
        LIMIT 1
        `,
          tenantId
        ),
        [tenantId, filters.userId, filters.teamId]
      );
      return result.rows.map((r) => r.id);
    }

    if (filters.userId) {
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
          tenantId
        ),
        [tenantId, filters.userId]
      );
      return result.rows.map((r) => r.id);
    }

    if (filters.teamId) {
      const result = await this.db.query<{ id: string }>(
        this.scoped(
          `
        SELECT id
        FROM users
        WHERE tenant_id = $1
          AND manager_id = $2
          AND is_active = TRUE
        ORDER BY created_at ASC
        `,
          tenantId
        ),
        [tenantId, filters.teamId]
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
        tenantId
      ),
      [tenantId]
    );
    return result.rows.map((r) => r.id);
  }

  async findUsersByIds(tenantId: string, userIds: string[]): Promise<ReportUserRow[]> {
    if (userIds.length === 0) return [];
    const result = await this.db.query<ReportUserRow>(
      this.scoped(
        `
      SELECT id, first_name, last_name
      FROM users
      WHERE tenant_id = $1
        AND id = ANY($2::uuid[])
      `,
        tenantId
      ),
      [tenantId, userIds]
    );
    return result.rows;
  }

  async getKpiSummaries(
    tenantId: string,
    userIds: string[],
    dateFrom: Date,
    dateTo: Date
  ): Promise<KpiSummaryRow[]> {
    if (userIds.length === 0) return [];
    const result = await this.db.query<KpiSummaryRow>(
      this.scoped(
        `
      SELECT
        user_id,
        COALESCE(SUM(tasks_completed), 0)::int AS tasks_completed,
        COALESCE(SUM(tasks_on_time), 0)::int AS tasks_on_time,
        COALESCE(SUM(tasks_overdue), 0)::int AS tasks_overdue
      FROM kpi_records
      WHERE tenant_id = $1
        AND user_id = ANY($2::uuid[])
        AND period_start >= $3
        AND period_end <= $4
      GROUP BY user_id
      `,
        tenantId
      ),
      [tenantId, userIds, dateFrom, dateTo]
    );
    return result.rows;
  }

  async getPayrollSummaries(
    tenantId: string,
    userIds: string[],
    dateFrom: Date,
    dateTo: Date
  ): Promise<PayrollSummaryRow[]> {
    if (userIds.length === 0) return [];
    const result = await this.db.query<PayrollSummaryRow>(
      this.scoped(
        `
      SELECT
        user_id,
        COALESCE(SUM(base), 0)::double precision AS base_total,
        COALESCE(SUM(bonus), 0)::double precision AS bonus_total,
        COALESCE(SUM(total), 0)::double precision AS total_total
      FROM payments
      WHERE tenant_id = $1
        AND user_id = ANY($2::uuid[])
        AND period_start >= $3
        AND period_end <= $4
      GROUP BY user_id
      `,
        tenantId
      ),
      [tenantId, userIds, dateFrom, dateTo]
    );
    return result.rows;
  }

  async getTaskSummaries(
    tenantId: string,
    userIds: string[],
    dateFrom: Date,
    dateTo: Date
  ): Promise<TaskSummaryRow[]> {
    if (userIds.length === 0) return [];
    const result = await this.db.query<TaskSummaryRow>(
      this.scoped(
        `
      SELECT
        assignee_id AS user_id,
        COUNT(*) FILTER (
          WHERE status = 'DONE'
            AND completed_at IS NOT NULL
            AND completed_at >= $3
            AND completed_at <= $4
        )::int AS completed_tasks,
        (
          COUNT(*) FILTER (
            WHERE status = 'DONE'
              AND completed_at IS NOT NULL
              AND deadline IS NOT NULL
              AND completed_at > deadline
              AND completed_at >= $3
              AND completed_at <= $4
          )
          +
          COUNT(*) FILTER (
            WHERE status <> 'DONE'
              AND deadline IS NOT NULL
              AND deadline < $4
          )
        )::int AS overdue_tasks
      FROM tasks
      WHERE tenant_id = $1
        AND assignee_id = ANY($2::uuid[])
      GROUP BY assignee_id
      `,
        tenantId
      ),
      [tenantId, userIds, dateFrom, dateTo]
    );
    return result.rows;
  }

  async insertHistory(params: {
    tenantId: string;
    reportType: 'KPI' | 'PAYROLL' | 'TASKS';
    format: 'JSON' | 'CSV' | 'PDF';
    filters: Record<string, unknown>;
    payload: Record<string, unknown>;
    generatedBy: string;
  }): Promise<ReportHistoryRow> {
    const result = await this.db.query<ReportHistoryRow>(
      this.scoped(
        `
      INSERT INTO reports_history (
        tenant_id,
        report_type,
        format,
        filters,
        payload,
        generated_by,
        created_at
      )
      VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, NOW())
      RETURNING id, tenant_id, report_type, format, filters, payload, generated_by, created_at
      `,
        params.tenantId
      ),
      [
        params.tenantId,
        params.reportType,
        params.format,
        JSON.stringify(params.filters),
        JSON.stringify(params.payload),
        params.generatedBy,
      ]
    );
    return result.rows[0];
  }

  async listHistory(
    tenantId: string,
    query: ListReportHistoryQuery
  ): Promise<ReportHistoryRow[]> {
    const offset = (query.page - 1) * query.limit;
    const values: Array<string | number> = [tenantId];
    const conditions: string[] = ['tenant_id = $1'];
    let i = 2;

    if (query.type) {
      conditions.push(`report_type = $${i++}`);
      values.push(query.type);
    }

    values.push(query.limit, offset);
    const result = await this.db.query<ReportHistoryRow>(
      this.scoped(
        `
      SELECT id, tenant_id, report_type, format, filters, payload, generated_by, created_at
      FROM reports_history
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${i++} OFFSET $${i}
      `,
        tenantId
      ),
      values
    );
    return result.rows.map((row) => ({
      ...row,
      filters: row.filters ?? {},
      payload: row.payload ?? {},
    }));
  }

  async countHistory(tenantId: string, query: ListReportHistoryQuery): Promise<number> {
    const values: string[] = [tenantId];
    const conditions: string[] = ['tenant_id = $1'];
    let i = 2;

    if (query.type) {
      conditions.push(`report_type = $${i++}`);
      values.push(query.type);
    }

    const result = await this.db.query<{ c: string }>(
      this.scoped(
        `
      SELECT COUNT(*)::text AS c
      FROM reports_history
      WHERE ${conditions.join(' AND ')}
      `,
        tenantId
      ),
      values
    );
    return Number(result.rows[0]?.c ?? 0);
  }
}
