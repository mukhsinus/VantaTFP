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

  async create(
    data: Omit<PayrollEntryRecord, 'id' | 'created_at' | 'updated_at'>
  ): Promise<PayrollEntryRecord> {
    const result = await this.db.query<PayrollEntryRecord>(
      `
      INSERT INTO payroll (
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
        $9,
        $10,
        NOW(),
        NOW()
      )
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
      [
        data.tenant_id,
        data.employee_id,
        data.period_start,
        data.period_end,
        data.base_salary,
        data.bonuses,
        data.deductions,
        data.net_salary,
        data.status,
        data.notes,
      ]
    );
    return result.rows[0];
  }

  async update(
    payrollId: string,
    tenantId: string,
    data: Partial<
      Pick<
        PayrollEntryRecord,
        'base_salary' | 'bonuses' | 'deductions' | 'net_salary' | 'status' | 'notes' | 'approved_by'
      >
    >
  ): Promise<PayrollEntryRecord> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.base_salary !== undefined) {
      updates.push(`base_salary = $${paramIndex++}`);
      values.push(data.base_salary);
    }
    if (data.bonuses !== undefined) {
      updates.push(`bonuses = $${paramIndex++}`);
      values.push(data.bonuses);
    }
    if (data.deductions !== undefined) {
      updates.push(`deductions = $${paramIndex++}`);
      values.push(data.deductions);
    }
    if (data.net_salary !== undefined) {
      updates.push(`net_salary = $${paramIndex++}`);
      values.push(data.net_salary);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(data.notes);
    }
    if (data.approved_by !== undefined) {
      updates.push(`approved_by = $${paramIndex++}`);
      values.push(data.approved_by);
    }

    updates.push(`updated_at = NOW()`);
    values.push(payrollId);
    values.push(tenantId);

    const query = `
      UPDATE payroll
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex + 1} AND tenant_id = $${paramIndex + 2}
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
    `;

    const result = await this.db.query<PayrollEntryRecord>(query, values);
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

    const result = await this.db.query<{ count: number }>(query, params);
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }
}
