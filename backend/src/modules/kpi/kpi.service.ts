import { KpiRepository, KpiRecord, KpiProgressRecord } from './kpi.repository.js';
import { PayrollService } from '../payroll/payroll.service.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { logger } from '../../shared/utils/logger.js';

export interface KpiResponse {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  targetValue: number;
  unit: string;
  period: string;
  assigneeId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface KpiProgressResponse {
  id: string;
  kpiId: string;
  tenantId: string;
  actualValue: number;
  recordedAt: string;
  notes: string | null;
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasMore: boolean;
}

export interface KpiListResponse {
  data: KpiResponse[];
  pagination: PaginationMeta;
}

export interface KpiCalculationResponse {
  userId: string;
  periodStart: string;
  periodEnd: string;
  tasksCompleted: number;
  tasksOnTime: number;
  tasksOverdue: number;
  score: number;
}

export class KpiService {
  constructor(
    private readonly kpiRepository: KpiRepository,
    private readonly payrollService?: PayrollService
  ) {}

  async listKpis(tenantId: string): Promise<KpiResponse[]> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const kpis = await this.kpiRepository.findAllByTenant(tenantId);
    return kpis.map(this.toResponse);
  }

  async listKpisPaginated(
    tenantId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<KpiListResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const kpis = await this.kpiRepository.findAllByTenantPaginated(tenantId, page, limit);
    const total = await this.kpiRepository.countByTenant(tenantId);
    const pages = Math.ceil(total / limit);

    return {
      data: kpis.map(this.toResponse),
      pagination: {
        total,
        page,
        limit,
        pages,
        hasMore: page < pages,
      },
    };
  }

  async getKpiById(kpiId: string, tenantId: string): Promise<KpiResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const kpi = await this.kpiRepository.findByIdAndTenant(kpiId, tenantId);
    if (!kpi) {
      throw ApplicationError.notFound('KPI');
    }

    return this.toResponse(kpi);
  }

  async getKpiProgress(kpiId: string, tenantId: string): Promise<KpiProgressResponse[]> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const kpi = await this.kpiRepository.findByIdAndTenant(kpiId, tenantId);
    if (!kpi) {
      throw ApplicationError.notFound('KPI');
    }

    const progress = await this.kpiRepository.findProgressByKpi(kpiId, tenantId);
    return progress.map(this.progressToResponse);
  }

  async calculateKPI(
    userId: string,
    tenantId: string,
    periodStartInput: string,
    periodEndInput: string
  ): Promise<KpiCalculationResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const periodStart = new Date(periodStartInput);
    const periodEnd = new Date(periodEndInput);

    if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
      throw ApplicationError.badRequest('Invalid period');
    }

    if (periodEnd < periodStart) {
      throw ApplicationError.badRequest('periodEnd must be greater than or equal to periodStart');
    }

    const calculated = await this.kpiRepository.calculateKpiFromTasks(
      tenantId,
      userId,
      periodStart,
      periodEnd
    );

    const cachedRecord = await this.kpiRepository.upsertKpiRecordCache({
      tenantId,
      userId,
      periodStart,
      periodEnd,
      calculated,
    });

    if (this.payrollService) {
      try {
        await this.payrollService.calculatePayroll(
          userId,
          tenantId,
          periodStart.toISOString(),
          periodEnd.toISOString()
        );
      } catch (error) {
        logger.error(
          {
            err: error,
            tenantId,
            userId,
            period: {
              periodStart: periodStart.toISOString(),
              periodEnd: periodEnd.toISOString(),
            },
          },
          'Payroll recalculation failed after KPI recalculation'
        );
      }
    }

    return {
      userId,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      tasksCompleted: cachedRecord.tasks_completed,
      tasksOnTime: cachedRecord.tasks_on_time,
      tasksOverdue: cachedRecord.tasks_overdue,
      score: Number(cachedRecord.score),
    };
  }

  private toResponse(kpi: KpiRecord): KpiResponse {
    return {
      id: kpi.id,
      tenantId: kpi.tenant_id,
      name: kpi.name,
      description: kpi.description,
      targetValue: kpi.target_value,
      unit: kpi.unit,
      period: kpi.period,
      assigneeId: kpi.assignee_id,
      createdBy: kpi.created_by,
      createdAt: kpi.created_at.toISOString(),
      updatedAt: kpi.updated_at.toISOString(),
    };
  }

  private progressToResponse(progress: KpiProgressRecord): KpiProgressResponse {
    return {
      id: progress.id,
      kpiId: progress.kpi_id,
      tenantId: progress.tenant_id,
      actualValue: progress.actual_value,
      recordedAt: progress.recorded_at.toISOString(),
      notes: progress.notes,
      createdAt: progress.created_at.toISOString(),
    };
  }
}
