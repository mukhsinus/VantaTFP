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
    _tenantId: string,
    _filters: ListPayrollQuery
  ): Promise<PayrollEntryRecord[]> {
    throw new Error('Not implemented');
  }

  async findByIdAndTenant(
    _payrollId: string,
    _tenantId: string
  ): Promise<PayrollEntryRecord | null> {
    throw new Error('Not implemented');
  }

  async create(
    _data: Omit<PayrollEntryRecord, 'id' | 'created_at' | 'updated_at'>
  ): Promise<PayrollEntryRecord> {
    throw new Error('Not implemented');
  }

  async update(
    _payrollId: string,
    _tenantId: string,
    _data: Partial<
      Pick<
        PayrollEntryRecord,
        'base_salary' | 'bonuses' | 'deductions' | 'net_salary' | 'status' | 'notes' | 'approved_by'
      >
    >
  ): Promise<PayrollEntryRecord> {
    throw new Error('Not implemented');
  }

  async countByTenant(
    _tenantId: string,
    _filters: Omit<ListPayrollQuery, 'page' | 'limit'>
  ): Promise<number> {
    throw new Error('Not implemented');
  }
}
