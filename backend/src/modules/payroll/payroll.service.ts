import {
  PayrollRepository,
  PayrollEntryRecord,
  KpiCacheRecord,
  PayrollRuleRecord,
  PayrollRecordHistoryRow,
} from './payroll.repository.js';
import {
  ListPayrollQuery,
  CreatePayrollRuleInput,
  UpdatePayrollRuleInput,
  parsePayrollRuleConfig,
  fixedRuleConfigSchema,
  perTaskRuleConfigSchema,
  kpiBasedRuleConfigSchema,
} from './payroll.schema.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { env } from '../../shared/utils/env.js';
import { assertTenantEntityMatch } from '../../shared/utils/tenant-scope.js';

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

export interface PayrollRuleResponse {
  id: string;
  tenantId: string;
  name: string;
  type: 'fixed' | 'per_task' | 'kpi_based';
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApplyPayrollRuleResponse {
  ruleId: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  breakdown: Record<string, unknown>;
  payment: {
    base: number;
    bonus: number;
    total: number;
  };
}

export interface PayrollRecordHistoryResponse {
  id: string;
  tenantId: string;
  userId: string;
  amount: number;
  breakdown: Record<string, unknown>;
  payrollRuleId: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
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
      data: entries.map((entry) => {
        assertTenantEntityMatch(entry.tenant_id, tenantId, 'Payroll entry');
        return this.toResponse(entry);
      }),
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
    assertTenantEntityMatch(entry.tenant_id, tenantId, 'Payroll entry');

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
    assertTenantEntityMatch(updated.tenant_id, tenantId, 'Payroll entry');

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

    const comp = this.computeFromKpiRecord(kpi);

    const payment = await this.payrollRepository.upsertPayment({
      tenantId,
      userId,
      periodStart,
      periodEnd,
      base: comp.base,
      bonus: comp.bonus,
      total: comp.total,
    });

    return {
      userId,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      base: payment.base,
      bonus: payment.bonus,
      total: payment.total,
      breakdown: {
        score: comp.score,
        source: comp.source,
      },
    };
  }

  async listPayrollRules(
    tenantId: string,
    includeInactive: boolean
  ): Promise<PayrollRuleResponse[]> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const rows = await this.payrollRepository.listPayrollRulesForTenant(
      tenantId,
      includeInactive
    );
    return rows.map((r) => {
      assertTenantEntityMatch(r.tenant_id, tenantId, 'Payroll rule');
      return this.ruleToResponse(r);
    });
  }

  async createPayrollRule(
    tenantId: string,
    body: CreatePayrollRuleInput
  ): Promise<PayrollRuleResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const parsed = parsePayrollRuleConfig(body.type, body.config);
    if (!parsed.ok) {
      throw ApplicationError.badRequest(parsed.error);
    }

    const row = await this.payrollRepository.insertPayrollRule({
      tenantId,
      name: body.name?.trim() ?? '',
      type: body.type,
      config: parsed.config,
    });
    assertTenantEntityMatch(row.tenant_id, tenantId, 'Payroll rule');

    return this.ruleToResponse(this.normalizeRuleRow(row));
  }

  async updatePayrollRule(
    ruleId: string,
    tenantId: string,
    body: UpdatePayrollRuleInput
  ): Promise<PayrollRuleResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const existing = await this.payrollRepository.findPayrollRuleByIdAndTenant(ruleId, tenantId);
    if (!existing) {
      throw ApplicationError.notFound('Payroll rule');
    }

    const patch: {
      name?: string;
      config?: Record<string, unknown>;
      is_active?: boolean;
    } = {};

    if (body.name !== undefined) {
      patch.name = body.name.trim();
    }
    if (body.is_active !== undefined) {
      patch.is_active = body.is_active;
    }
    if (body.config !== undefined) {
      const parsed = parsePayrollRuleConfig(
        existing.type as 'fixed' | 'per_task' | 'kpi_based',
        body.config
      );
      if (!parsed.ok) {
        throw ApplicationError.badRequest(parsed.error);
      }
      patch.config = parsed.config;
    }

    const updated = await this.payrollRepository.updatePayrollRule(ruleId, tenantId, patch);

    if (!updated) {
      throw ApplicationError.notFound('Payroll rule');
    }
    assertTenantEntityMatch(updated.tenant_id, tenantId, 'Payroll rule');

    return this.ruleToResponse(this.normalizeRuleRow(updated));
  }

  async applyPayrollRule(
    ruleId: string,
    tenantId: string,
    userId: string,
    periodStartInput: string,
    periodEndInput: string
  ): Promise<ApplyPayrollRuleResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const rule = await this.payrollRepository.findPayrollRuleByIdAndTenant(ruleId, tenantId);
    if (!rule) {
      throw ApplicationError.notFound('Payroll rule');
    }

    if (!rule.is_active) {
      throw ApplicationError.badRequest('Cannot apply an inactive payroll rule');
    }

    const inTenant = await this.payrollRepository.isActiveUserInTenant(tenantId, userId);
    if (!inTenant) {
      throw ApplicationError.badRequest('User not found in tenant');
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

    const type = rule.type as 'fixed' | 'per_task' | 'kpi_based';
    let amount = 0;
    let paymentBase = 0;
    let paymentBonus = 0;
    let paymentTotal = 0;
    let breakdown: Record<string, unknown>;

    if (type === 'fixed') {
      const cfg = fixedRuleConfigSchema.parse(rule.config);
      amount = this.roundMoney(cfg.amount);
      paymentBase = amount;
      paymentBonus = 0;
      paymentTotal = amount;
      breakdown = {
        ruleType: type,
        ruleId: rule.id,
        ruleName: rule.name,
        mode: 'fixed',
        amount,
      };
    } else if (type === 'per_task') {
      const cfg = perTaskRuleConfigSchema.parse(rule.config);
      const tasksCompleted = kpi ? Number(kpi.tasks_completed ?? 0) : 0;
      amount = this.roundMoney(cfg.ratePerTask * tasksCompleted);
      paymentBase = 0;
      paymentBonus = amount;
      paymentTotal = amount;
      breakdown = {
        ruleType: type,
        ruleId: rule.id,
        ruleName: rule.name,
        mode: 'per_task',
        ratePerTask: cfg.ratePerTask,
        tasksCompleted,
        kpiSource: kpi ? 'KPI_RECORD' : 'NO_KPI_RECORD',
        kpiSnapshot: kpi
          ? {
              tasks_completed: kpi.tasks_completed,
              tasks_on_time: kpi.tasks_on_time,
              tasks_overdue: kpi.tasks_overdue,
              score: kpi.score,
            }
          : null,
      };
    } else {
      const cfg = kpiBasedRuleConfigSchema.parse(rule.config);
      const comp = this.computeFromKpiRecord(kpi, {
        baseSalary: cfg.baseSalary,
      });
      amount = comp.total;
      paymentBase = comp.base;
      paymentBonus = comp.bonus;
      paymentTotal = comp.total;
      breakdown = {
        ruleType: type,
        ruleId: rule.id,
        ruleName: rule.name,
        mode: 'kpi_based',
        score: comp.score,
        source: comp.source,
        base: comp.base,
        bonus: comp.bonus,
        kpiSnapshot: kpi
          ? {
              tasks_completed: kpi.tasks_completed,
              tasks_on_time: kpi.tasks_on_time,
              tasks_overdue: kpi.tasks_overdue,
              score: kpi.score,
            }
          : null,
      };
    }

    await this.payrollRepository.insertPayrollRecordHistory({
      tenantId,
      userId,
      payrollRuleId: rule.id,
      amount,
      breakdown,
      periodStart,
      periodEnd,
    });

    const payment = await this.payrollRepository.upsertPayment({
      tenantId,
      userId,
      periodStart,
      periodEnd,
      base: paymentBase,
      bonus: paymentBonus,
      total: paymentTotal,
    });

    return {
      ruleId: rule.id,
      userId,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      amount,
      breakdown,
      payment: {
        base: payment.base,
        bonus: payment.bonus,
        total: payment.total,
      },
    };
  }

  async listPayrollRecordHistory(
    tenantId: string,
    query: { userId?: string; page: number; limit: number }
  ): Promise<{
    data: PayrollRecordHistoryResponse[];
    pagination: PaginationMeta;
  }> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const total = await this.payrollRepository.countPayrollRecordHistory(tenantId, {
      userId: query.userId,
    });
    const rows = await this.payrollRepository.listPayrollRecordHistory(tenantId, {
      userId: query.userId,
      page: query.page,
      limit: query.limit,
    });
    const pages = Math.ceil(total / query.limit) || (total === 0 ? 0 : 1);

    return {
      data: rows.map((r) => {
        assertTenantEntityMatch(r.tenant_id, tenantId, 'Payroll record');
        return this.recordHistoryToResponse(r);
      }),
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        pages,
        hasMore: query.page < pages,
      },
    };
  }

  /**
   * Same KPI → payroll mapping as legacy `calculatePayroll` (score % of base when KPI row exists).
   */
  private computeFromKpiRecord(
    kpi: KpiCacheRecord | null,
    options?: { baseSalary?: number }
  ): {
    base: number;
    bonus: number;
    total: number;
    score: number;
    source: 'KPI_RECORD' | 'NO_KPI_RECORD';
  } {
    if (!kpi) {
      return { base: 0, bonus: 0, total: 0, score: 0, source: 'NO_KPI_RECORD' };
    }

    const baseRaw = options?.baseSalary ?? env.PAYROLL_DEFAULT_BASE_SALARY;
    const base = this.roundMoney(baseRaw);
    const score = Number(kpi.score ?? 0);
    const bonus = this.roundMoney((score / 100) * base);
    const total = this.roundMoney(base + bonus);
    return { base, bonus, total, score, source: 'KPI_RECORD' };
  }

  private normalizeRuleRow(row: PayrollRuleRecord): PayrollRuleRecord {
    return {
      ...row,
      config:
        row.config && typeof row.config === 'object'
          ? (row.config as Record<string, unknown>)
          : {},
    };
  }

  private ruleToResponse(row: PayrollRuleRecord): PayrollRuleResponse {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      type: row.type as PayrollRuleResponse['type'],
      config: row.config,
      isActive: row.is_active,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  private recordHistoryToResponse(row: PayrollRecordHistoryRow): PayrollRecordHistoryResponse {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      amount: row.amount,
      breakdown: row.breakdown,
      payrollRuleId: row.payroll_rule_id,
      periodStart: row.period_start ? row.period_start.toISOString() : null,
      periodEnd: row.period_end ? row.period_end.toISOString() : null,
      createdAt: row.created_at.toISOString(),
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
