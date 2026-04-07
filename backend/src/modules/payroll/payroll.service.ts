import { PayrollRepository, PayrollEntryRecord } from './payroll.repository.js';
import { ListPayrollQuery } from './payroll.schema.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { env } from '../../shared/utils/env.js';

export interface PayrollEntryResponse {
  id: string;
  tenantId: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: string;
  notes: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasMore: boolean;
}

export interface PayrollListResponse {
  data: PayrollEntryResponse[];
  pagination: PaginationMeta;
}

export interface PayrollCalculationResponse {
  userId: string;
  periodStart: string;
  periodEnd: string;
  base: number;
  bonus: number;
  total: number;
  breakdown: {
    score: number;
    source: 'KPI_RECORD' | 'NO_KPI_RECORD';
  };
}

export class PayrollService {
  constructor(private readonly payrollRepository: PayrollRepository) {}

  async listPayrollEntries(tenantId: string, query: ListPayrollQuery): Promise<PayrollListResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const entries = await this.payrollRepository.findAllByTenant(tenantId, query);
    const total = await this.payrollRepository.countByTenant(tenantId, {
      employeeId: query.employeeId,
      status: query.status,
    });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const pages = Math.ceil(total / limit);

    return {
      data: entries.map(this.toResponse),
      pagination: {
        total,
        page,
        limit,
        pages,
        hasMore: page < pages,
      },
    };
  }

  async getPayrollEntryById(payrollId: string, tenantId: string): Promise<PayrollEntryResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const entry = await this.payrollRepository.findByIdAndTenant(payrollId, tenantId);
    if (!entry) {
      throw ApplicationError.notFound('Payroll entry');
    }

    return this.toResponse(entry);
  }

  async approvePayrollEntry(
    payrollId: string,
    tenantId: string,
    approvedByUserId: string
  ): Promise<PayrollEntryResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const entry = await this.payrollRepository.findByIdAndTenant(payrollId, tenantId);
    if (!entry) {
      throw ApplicationError.notFound('Payroll entry');
    }

    if (entry.status !== 'DRAFT') {
      throw ApplicationError.badRequest(`Only DRAFT entries can be approved. Current status: ${entry.status}`);
    }

    const updated = await this.payrollRepository.approve(payrollId, tenantId, approvedByUserId);

    return this.toResponse(updated);
  }

  async calculatePayroll(
    userId: string,
    tenantId: string,
    periodStartInput: string,
    periodEndInput: string
  ): Promise<PayrollCalculationResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    if (!userId) {
      throw ApplicationError.badRequest('Missing userId');
    }

    const periodStart = new Date(periodStartInput);
    const periodEnd = new Date(periodEndInput);
    if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
      throw ApplicationError.badRequest('Invalid period');
    }
    if (periodEnd < periodStart) {
      throw ApplicationError.badRequest('periodEnd must be greater than or equal to periodStart');
    }

    const kpi = await this.payrollRepository.findKpiCacheForPeriod(
      tenantId,
      userId,
      periodStart,
      periodEnd
    );

    let base = 0;
    let bonus = 0;
    let total = 0;
    let score = 0;
    let source: 'KPI_RECORD' | 'NO_KPI_RECORD' = 'NO_KPI_RECORD';

    if (!kpi) {
      base = 0;
      bonus = 0;
      total = 0;
      score = 0;
      source = 'NO_KPI_RECORD';
    } else {
      base = this.roundMoney(env.PAYROLL_DEFAULT_BASE_SALARY);
      score = Number(kpi.score ?? 0);
      bonus = this.roundMoney((score / 100) * base);
      total = this.roundMoney(base + bonus);
      source = 'KPI_RECORD';
    }

    const payment = await this.payrollRepository.upsertPayment({
      tenantId,
      userId,
      periodStart,
      periodEnd,
      base,
      bonus,
      total,
    });

    return {
      userId,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      base: payment.base,
      bonus: payment.bonus,
      total: payment.total,
      breakdown: {
        score,
        source,
      },
    };
  }

  private toResponse(entry: PayrollEntryRecord): PayrollEntryResponse {
    return {
      id: entry.id,
      tenantId: entry.tenant_id,
      employeeId: entry.employee_id,
      periodStart: entry.period_start.toISOString(),
      periodEnd: entry.period_end.toISOString(),
      baseSalary: entry.base_salary,
      bonuses: entry.bonuses,
      deductions: entry.deductions,
      netSalary: entry.net_salary,
      status: entry.status,
      notes: entry.notes,
      approvedBy: entry.approved_by,
      createdAt: entry.created_at.toISOString(),
      updatedAt: entry.updated_at.toISOString(),
    };
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
