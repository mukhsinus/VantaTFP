import { Pool } from 'pg';
import { ListPayrollQuery } from './payroll.schema.js';
import { enforceTenantScope } from '../../shared/repository/tenant-enforcement.js';

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

export interface PayrollRuleRecord {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PayrollRecordHistoryRow {
  id: string;
  tenant_id: string;
  user_id: string;
  amount: number;
  breakdown: Record<string, unknown>;
  payroll_rule_id: string | null;
  period_start: Date | null;
  period_end: Date | null;
  created_at: Date;
}

export class PayrollRepository {
  constructor(private readonly db: Pool) {}

  private scoped(sql: string, tenantId: string): string {
    return enforceTenantScope(sql, tenantId);
  }

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

    const result = await this.db.query<PayrollEntryRecord>(this.scoped(query, tenantId), params);
    return result.rows;
  }

  async findByIdAndTenant(
    payrollId: string,
    tenantId: string
  ): Promise<PayrollEntryRecord | null> {
    const result = await this.db.query<PayrollEntryRecord>(
      this.scoped(
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
        tenantId
      ),
      [payrollId, tenantId]
    );
    return result.rows[0] ?? null;
  }

  async approve(payrollId: string, tenantId: string, approvedBy: string): Promise<PayrollEntryRecord> {
    const result = await this.db.query<PayrollEntryRecord>(
      this.scoped(
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
        tenantId
      ),
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

    const result = await this.db.query<{ count: string }>(this.scoped(query, tenantId), params);
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  async findKpiCacheForPeriod(
    tenantId: string,
    userId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<KpiCacheRecord | null> {
    const result = await this.db.query<KpiCacheRecord>(
      this.scoped(
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
        tenantId
      ),
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
      this.scoped(
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
        params.tenantId
      ),
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
      this.scoped(
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
        tenantId
      ),
      [tenantId, userId, periodStart, periodEnd]
    );

    return result.rows[0] ?? null;
  }

  async isActiveUserInTenant(tenantId: string, userId: string): Promise<boolean> {
    const result = await this.db.query<{ ok: boolean }>(
      this.scoped(
        `
      SELECT EXISTS(
        SELECT 1
        FROM users
        WHERE tenant_id = $1
          AND id = $2
          AND is_active = TRUE
      ) AS ok
      `,
        tenantId
      ),
      [tenantId, userId]
    );
    return Boolean(result.rows[0]?.ok);
  }

  async insertPayrollRule(params: {
    tenantId: string;
    name: string;
    type: string;
    config: Record<string, unknown>;
  }): Promise<PayrollRuleRecord> {
    const result = await this.db.query<PayrollRuleRecord>(
      this.scoped(
        `
      INSERT INTO payroll_rules (tenant_id, name, type, config, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4::jsonb, TRUE, NOW(), NOW())
      RETURNING
        id,
        tenant_id,
        name,
        type,
        config,
        is_active,
        created_at,
        updated_at
      `,
        params.tenantId
      ),
      [params.tenantId, params.name, params.type, JSON.stringify(params.config)]
    );
    const row = result.rows[0];
    return {
      ...row,
      config:
        row.config && typeof row.config === 'object'
          ? (row.config as Record<string, unknown>)
          : {},
    };
  }

  async updatePayrollRule(
    ruleId: string,
    tenantId: string,
    data: {
      name?: string;
      config?: Record<string, unknown>;
      is_active?: boolean;
    }
  ): Promise<PayrollRuleRecord | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let p = 1;

    if (data.name !== undefined) {
      sets.push(`name = $${p++}`);
      values.push(data.name);
    }
    if (data.config !== undefined) {
      sets.push(`config = $${p++}::jsonb`);
      values.push(JSON.stringify(data.config));
    }
    if (data.is_active !== undefined) {
      sets.push(`is_active = $${p++}`);
      values.push(data.is_active);
    }

    if (sets.length === 0) {
      return this.findPayrollRuleByIdAndTenant(ruleId, tenantId);
    }

    sets.push('updated_at = NOW()');
    values.push(ruleId, tenantId);
    const idParam = values.length - 1;
    const tenantParam = values.length;

    const result = await this.db.query<PayrollRuleRecord>(
      this.scoped(
        `
      UPDATE payroll_rules
      SET ${sets.join(', ')}
      WHERE id = $${idParam}
        AND tenant_id = $${tenantParam}
      RETURNING
        id,
        tenant_id,
        name,
        type,
        config,
        is_active,
        created_at,
        updated_at
      `,
        tenantId
      ),
      values
    );

    const updated = result.rows[0];
    if (!updated) {
      return null;
    }
    return {
      ...updated,
      config:
        updated.config && typeof updated.config === 'object'
          ? (updated.config as Record<string, unknown>)
          : {},
    };
  }

  async findPayrollRuleByIdAndTenant(
    ruleId: string,
    tenantId: string
  ): Promise<PayrollRuleRecord | null> {
    const result = await this.db.query<PayrollRuleRecord>(
      this.scoped(
        `
      SELECT
        id,
        tenant_id,
        name,
        type,
        config,
        is_active,
        created_at,
        updated_at
      FROM payroll_rules
      WHERE id = $1
        AND tenant_id = $2
      LIMIT 1
      `,
        tenantId
      ),
      [ruleId, tenantId]
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return {
      ...row,
      config:
        row.config && typeof row.config === 'object'
          ? (row.config as Record<string, unknown>)
          : {},
    };
  }

  async listPayrollRulesForTenant(
    tenantId: string,
    includeInactive: boolean
  ): Promise<PayrollRuleRecord[]> {
    const result = await this.db.query<PayrollRuleRecord>(
      this.scoped(
        `
      SELECT
        id,
        tenant_id,
        name,
        type,
        config,
        is_active,
        created_at,
        updated_at
      FROM payroll_rules
      WHERE tenant_id = $1
        ${includeInactive ? '' : 'AND is_active = TRUE'}
      ORDER BY created_at DESC
      `,
        tenantId
      ),
      [tenantId]
    );
    return result.rows.map((row) => ({
      ...row,
      config:
        row.config && typeof row.config === 'object'
          ? (row.config as Record<string, unknown>)
          : {},
    }));
  }

  async insertPayrollRecordHistory(params: {
    tenantId: string;
    userId: string;
    payrollRuleId: string;
    amount: number;
    breakdown: Record<string, unknown>;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<PayrollRecordHistoryRow> {
    const result = await this.db.query<PayrollRecordHistoryRow>(
      this.scoped(
        `
      INSERT INTO payroll_records (
        tenant_id,
        user_id,
        amount,
        breakdown,
        payroll_rule_id,
        period_start,
        period_end,
        created_at
      )
      VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, NOW())
      RETURNING
        id,
        tenant_id,
        user_id,
        amount::double precision AS amount,
        breakdown,
        payroll_rule_id,
        period_start,
        period_end,
        created_at
      `,
        params.tenantId
      ),
      [
        params.tenantId,
        params.userId,
        params.amount,
        JSON.stringify(params.breakdown),
        params.payrollRuleId,
        params.periodStart,
        params.periodEnd,
      ]
    );
    const row = result.rows[0];
    return {
      ...row,
      breakdown:
        row.breakdown && typeof row.breakdown === 'object'
          ? (row.breakdown as Record<string, unknown>)
          : {},
    };
  }

  async listPayrollRecordHistory(
    tenantId: string,
    filters: { userId?: string; page: number; limit: number }
  ): Promise<PayrollRecordHistoryRow[]> {
    const offset = (filters.page - 1) * filters.limit;
    const params: Array<string | number> = [tenantId];
    let q = `
      SELECT
        id,
        tenant_id,
        user_id,
        amount::double precision AS amount,
        breakdown,
        payroll_rule_id,
        period_start,
        period_end,
        created_at
      FROM payroll_records
      WHERE tenant_id = $1
    `;
    if (filters.userId) {
      params.push(filters.userId);
      q += ` AND user_id = $${params.length}`;
    }
    params.push(filters.limit, offset);
    q += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await this.db.query<PayrollRecordHistoryRow>(this.scoped(q, tenantId), params);
    return result.rows.map((row) => ({
      ...row,
      breakdown:
        row.breakdown && typeof row.breakdown === 'object'
          ? (row.breakdown as Record<string, unknown>)
          : {},
    }));
  }

  async countPayrollRecordHistory(
    tenantId: string,
    filters: { userId?: string }
  ): Promise<number> {
    const params: string[] = [tenantId];
    let q = `SELECT COUNT(*)::text AS c FROM payroll_records WHERE tenant_id = $1`;
    if (filters.userId) {
      params.push(filters.userId);
      q += ` AND user_id = $2`;
    }
    const result = await this.db.query<{ c: string }>(this.scoped(q, tenantId), params);
    return Number(result.rows[0]?.c ?? 0);
  }
}
