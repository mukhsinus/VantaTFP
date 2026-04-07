import { Pool } from 'pg';
import { ListPayrollQuery } from './payroll.schema.js';

export interface PayrollEntryRecord {
  id: string;
  tenant_id: string;
  employee_id: string;
  period_start: Date;
  period_end: Date;
  base_salary: number;
  bonuses: number;
  deductions: number;
  net_salary: number;
  status: string;
  notes: string | null;
  approved_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface KpiCacheRecord {
  tasks_completed: number;
  tasks_on_time: number;
  tasks_overdue: number;
  score: number;
}

export interface PaymentRecord {
  id: string;
  tenant_id: string;
  user_id: string;
  period_start: Date;
  period_end: Date;
  base: number;
  bonus: number;
  total: number;
  created_at: Date;
  updated_at: Date;
}

export class PayrollRepository {
  constructor(private readonly db: Pool) {}

  async findAllByTenant(
    tenantId: string,
    filters: ListPayrollQuery
  ): Promise<PayrollEntryRecord[]> {
    const offset = ((filters.page ?? 1) - 1) * (filters.limit ?? 20);
    let query = `
      SELECT
        id,
        tenant_id,
        employee_id,
        period_start,
        period_end,
        base_salary,
        bonuses,
        deductions,
        net_salary,
        status,
        notes,
        approved_by,
        created_at,
        updated_at
      FROM payroll
      WHERE tenant_id = $1
    `;

    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters.employeeId) {
      query += ` AND employee_id = $${paramIndex++}`;
      params.push(filters.employeeId);
    }

    if (filters.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    query += ` ORDER BY period_end DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(filters.limit ?? 20);
    params.push(offset);

    const result = await this.db.query<PayrollEntryRecord>(query, params);
    return result.rows;
  }

  async findByIdAndTenant(
    payrollId: string,
    tenantId: string
  ): Promise<PayrollEntryRecord | null> {
    const result = await this.db.query<PayrollEntryRecord>(
      `
      SELECT
        id,
        tenant_id,
        employee_id,
        period_start,
        period_end,
        base_salary,
        bonuses,
        deductions,
        net_salary,
        status,
        notes,
        approved_by,
        created_at,
        updated_at
      FROM payroll
      WHERE id = $1 AND tenant_id = $2
      LIMIT 1
      `,
      [payrollId, tenantId]
    );
    return result.rows[0] ?? null;
  }

  async approve(payrollId: string, tenantId: string, approvedBy: string): Promise<PayrollEntryRecord> {
    const result = await this.db.query<PayrollEntryRecord>(
      `
      UPDATE payroll
      SET
        status = 'APPROVED',
        approved_by = $1,
        updated_at = NOW()
      WHERE id = $2
        AND tenant_id = $3
      RETURNING
        id,
        tenant_id,
        employee_id,
        period_start,
        period_end,
        base_salary,
        bonuses,
        deductions,
        net_salary,
        status,
        notes,
        approved_by,
        created_at,
        updated_at
      `,
      [approvedBy, payrollId, tenantId]
    );
    return result.rows[0];
  }

  async countByTenant(
    tenantId: string,
    filters: Omit<ListPayrollQuery, 'page' | 'limit'>
  ): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM payroll WHERE tenant_id = $1`;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters.employeeId) {
      query += ` AND employee_id = $${paramIndex++}`;
      params.push(filters.employeeId);
    }

    if (filters.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    const result = await this.db.query<{ count: string }>(query, params);
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  async findKpiCacheForPeriod(
    tenantId: string,
    userId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<KpiCacheRecord | null> {
    const result = await this.db.query<KpiCacheRecord>(
      `
      SELECT
        tasks_completed,
        tasks_on_time,
        tasks_overdue,
        score
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

  async upsertPayment(params: {
    tenantId: string;
    userId: string;
    periodStart: Date;
    periodEnd: Date;
    base: number;
    bonus: number;
    total: number;
  }): Promise<PaymentRecord> {
    const result = await this.db.query<PaymentRecord>(
      `
      INSERT INTO payments (
        id,
        tenant_id,
        user_id,
        period_start,
        period_end,
        base,
        bonus,
        total,
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
      ON CONFLICT (tenant_id, user_id, period_start, period_end)
      DO UPDATE SET
        base = EXCLUDED.base,
        bonus = EXCLUDED.bonus,
        total = EXCLUDED.total,
        updated_at = NOW()
      RETURNING
        id,
        tenant_id,
        user_id,
        period_start,
        period_end,
        base::double precision AS base,
        bonus::double precision AS bonus,
        total::double precision AS total,
        created_at,
        updated_at
      `,
      [
        params.tenantId,
        params.userId,
        params.periodStart,
        params.periodEnd,
        params.base,
        params.bonus,
        params.total,
      ]
    );

    return result.rows[0];
  }

  async findPaymentByUserAndPeriod(
    tenantId: string,
    userId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<PaymentRecord | null> {
    const result = await this.db.query<PaymentRecord>(
      `
      SELECT
        id,
        tenant_id,
        user_id,
        period_start,
        period_end,
        base::double precision AS base,
        bonus::double precision AS bonus,
        total::double precision AS total,
        created_at,
        updated_at
      FROM payments
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
