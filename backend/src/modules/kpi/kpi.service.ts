import { KpiRepository, KpiRecord, KpiProgressRecord } from './kpi.repository.js';
import { CreateKpiDto, UpdateKpiDto, RecordKpiProgressDto } from './kpi.schema.js';
import { ApplicationError } from '../../shared/utils/application-error.js';

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

export class KpiService {
  constructor(private readonly kpiRepository: KpiRepository) {}

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

  async createKpi(
    tenantId: string,
    createdByUserId: string,
    data: CreateKpiDto
  ): Promise<KpiResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const kpi = await this.kpiRepository.create({
      tenant_id: tenantId,
      name: data.name,
      description: data.description ?? null,
      target_value: data.targetValue,
      unit: data.unit,
      period: data.period,
      assignee_id: data.assigneeId,
      created_by: createdByUserId,
    });

    return this.toResponse(kpi);
  }

  async updateKpi(
    kpiId: string,
    tenantId: string,
    data: UpdateKpiDto
  ): Promise<KpiResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const existing = await this.kpiRepository.findByIdAndTenant(kpiId, tenantId);
    if (!existing) {
      throw ApplicationError.notFound('KPI');
    }

    const updateData: Partial<KpiRecord> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description ?? null;
    if (data.targetValue !== undefined) updateData.target_value = data.targetValue;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.period !== undefined) updateData.period = data.period;

    const updated = await this.kpiRepository.update(kpiId, tenantId, updateData as any);
    return this.toResponse(updated);
  }

  async deleteKpi(kpiId: string, tenantId: string): Promise<void> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const kpi = await this.kpiRepository.findByIdAndTenant(kpiId, tenantId);
    if (!kpi) {
      throw ApplicationError.notFound('KPI');
    }

    await this.kpiRepository.delete(kpiId, tenantId);
  }

  async recordProgress(
    kpiId: string,
    tenantId: string,
    data: RecordKpiProgressDto
  ): Promise<KpiProgressResponse> {
    if (!tenantId) {
      throw ApplicationError.badRequest('Missing tenant context');
    }

    const kpi = await this.kpiRepository.findByIdAndTenant(kpiId, tenantId);
    if (!kpi) {
      throw ApplicationError.notFound('KPI');
    }

    const progress = await this.kpiRepository.recordProgress({
      kpi_id: kpiId,
      tenant_id: tenantId,
      actual_value: data.actualValue,
      recorded_at: data.recordedAt ? new Date(data.recordedAt) : new Date(),
      notes: data.notes ?? null,
    });

    return this.progressToResponse(progress);
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
