import { PayrollRepository, PayrollEntryRecord } from './payroll.repository.js';
import { CreatePayrollEntryDto, UpdatePayrollEntryDto, ListPayrollQuery } from './payroll.schema.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { getTierFeatures } from '../../shared/config/tier.config.js';

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

  async createPayrollEntry(tenantId: string, data: CreatePayrollEntryDto): Promise<PayrollEntryResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    // Calculate net salary
    const netSalary = data.baseSalary + data.bonuses - data.deductions;

    const entry = await this.payrollRepository.create({
      tenant_id: tenantId,
      employee_id: data.employeeId,
      period_start: new Date(data.periodStart),
      period_end: new Date(data.periodEnd),
      base_salary: data.baseSalary,
      bonuses: data.bonuses ?? 0,
      deductions: data.deductions ?? 0,
      net_salary: netSalary,
      status: 'DRAFT',
      notes: data.notes ?? null,
      approved_by: null,
    });

    return this.toResponse(entry);
  }

  async updatePayrollEntry(
    payrollId: string,
    tenantId: string,
    data: UpdatePayrollEntryDto
  ): Promise<PayrollEntryResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const existing = await this.payrollRepository.findByIdAndTenant(payrollId, tenantId);
    if (!existing) {
      throw ApplicationError.notFound('Payroll entry');
    }

    // Prevent updating approved/paid entries (except by admin - but that's enforced at controller level)
    if (existing.status !== 'DRAFT' && data.status !== existing.status) {
      throw ApplicationError.badRequest(
        `Cannot change status from ${existing.status} to ${data.status}`
      );
    }

    // Calculate new net salary if any salary fields changed
    let newNetSalary = existing.net_salary;
    if (
      data.baseSalary !== undefined ||
      data.bonuses !== undefined ||
      data.deductions !== undefined
    ) {
      newNetSalary =
        (data.baseSalary ?? existing.base_salary) +
        (data.bonuses ?? existing.bonuses) -
        (data.deductions ?? existing.deductions);
    }

    const updated = await this.payrollRepository.update(payrollId, tenantId, {
      base_salary: data.baseSalary,
      bonuses: data.bonuses,
      deductions: data.deductions,
      net_salary: newNetSalary,
      status: data.status,
      notes: data.notes,
    });

    return this.toResponse(updated);
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

    const updated = await this.payrollRepository.update(payrollId, tenantId, {
      status: 'APPROVED',
      approved_by: approvedByUserId,
    });

    return this.toResponse(updated);
  }

  /**
   * Check if payroll CRUD operations are allowed for the tenant plan
   */
  checkWriteAccessAllowed(tenantPlan: string): void {
    const tierFeatures = getTierFeatures(tenantPlan);

    if (!tierFeatures.payroll.fullCrud) {
      throw ApplicationError.forbidden(
        `Payroll management is not available in ${tenantPlan} plan. Please upgrade to PRO or ENTERPRISE to manage payroll.`
      );
    }
  }

  /**
   * Check if a payroll feature is available for the tenant plan
   */
  checkFeatureAvailable(tenantPlan: string, feature: 'kpiBasedCalculation' | 'flexibleCalculation'): void {
    const tierFeatures = getTierFeatures(tenantPlan);
    const isAvailable = tierFeatures.payroll[feature];

    if (!isAvailable) {
      const featureName = feature === 'kpiBasedCalculation' ? 'KPI-Based Payroll Calculation' : 'Flexible Salary Calculation';
      throw ApplicationError.forbidden(
        `${featureName} is not available in your current plan (${tenantPlan}). Please upgrade to PRO or ENTERPRISE.`
      );
    }
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
}
