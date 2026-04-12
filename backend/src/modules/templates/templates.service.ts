import { TemplatesRepository, TemplateRecord } from './templates.repository.js';
import { CreateTemplateInput, UpdateTemplateInput } from './templates.schema.js';
import { ApplicationError } from '../../shared/utils/application-error.js';

export interface TemplateResponse {
  id: string;
  name: string;
  description: string | null;
  defaultPriority: string;
  checklist: string[];
  defaultLabels: string[];
  defaultEstimatePoints: number | null;
  defaultEstimateMinutes: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export class TemplatesService {
  constructor(private readonly repo: TemplatesRepository) {}

  async list(tenantId: string): Promise<TemplateResponse[]> {
    const rows = await this.repo.findAll(tenantId);
    return rows.map((r) => this.toResponse(r));
  }

  async getById(tenantId: string, templateId: string): Promise<TemplateResponse> {
    const row = await this.repo.findById(tenantId, templateId);
    if (!row) throw ApplicationError.notFound('Template');
    return this.toResponse(row);
  }

  async create(tenantId: string, userId: string, input: CreateTemplateInput): Promise<TemplateResponse> {
    const row = await this.repo.create({
      tenant_id: tenantId,
      name: input.name,
      description: input.description ?? null,
      default_priority: input.defaultPriority,
      default_status: 'TODO',
      checklist: input.checklist,
      default_labels: input.defaultLabels,
      default_estimate_points: input.defaultEstimatePoints ?? null,
      default_estimate_minutes: input.defaultEstimateMinutes ?? null,
      created_by: userId,
    });
    return this.toResponse(row);
  }

  async update(tenantId: string, templateId: string, input: UpdateTemplateInput): Promise<TemplateResponse> {
    const row = await this.repo.update(tenantId, templateId, {
      name: input.name,
      description: input.description,
      default_priority: input.defaultPriority,
      checklist: input.checklist,
      default_labels: input.defaultLabels,
      default_estimate_points: input.defaultEstimatePoints,
      default_estimate_minutes: input.defaultEstimateMinutes,
    });
    if (!row) throw ApplicationError.notFound('Template');
    return this.toResponse(row);
  }

  async delete(tenantId: string, templateId: string): Promise<void> {
    const ok = await this.repo.delete(tenantId, templateId);
    if (!ok) throw ApplicationError.notFound('Template');
  }

  private toResponse(row: TemplateRecord): TemplateResponse {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      defaultPriority: row.default_priority,
      checklist: Array.isArray(row.checklist) ? row.checklist : [],
      defaultLabels: Array.isArray(row.default_labels) ? row.default_labels : [],
      defaultEstimatePoints: row.default_estimate_points,
      defaultEstimateMinutes: row.default_estimate_minutes,
      createdBy: row.created_by,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}
