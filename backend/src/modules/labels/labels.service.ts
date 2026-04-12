import { LabelsRepository, LabelRecord } from './labels.repository.js';
import { CreateLabelInput, UpdateLabelInput } from './labels.schema.js';
import { ApplicationError } from '../../shared/utils/application-error.js';

export interface LabelResponse {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export class LabelsService {
  constructor(private readonly repo: LabelsRepository) {}

  async list(tenantId: string): Promise<LabelResponse[]> {
    const rows = await this.repo.findAll(tenantId);
    return rows.map((r) => this.toResponse(r));
  }

  async create(tenantId: string, input: CreateLabelInput): Promise<LabelResponse> {
    const row = await this.repo.create(tenantId, input.name, input.color);
    return this.toResponse(row);
  }

  async update(tenantId: string, labelId: string, input: UpdateLabelInput): Promise<LabelResponse> {
    const row = await this.repo.update(tenantId, labelId, input);
    if (!row) throw ApplicationError.notFound('Label');
    return this.toResponse(row);
  }

  async delete(tenantId: string, labelId: string): Promise<void> {
    const ok = await this.repo.delete(tenantId, labelId);
    if (!ok) throw ApplicationError.notFound('Label');
  }

  async getTaskLabels(tenantId: string, taskId: string): Promise<LabelResponse[]> {
    const rows = await this.repo.getTaskLabels(tenantId, taskId);
    return rows.map((r) => this.toResponse(r));
  }

  async setTaskLabels(tenantId: string, taskId: string, labelIds: string[]): Promise<LabelResponse[]> {
    await this.repo.setTaskLabels(tenantId, taskId, labelIds);
    return this.getTaskLabels(tenantId, taskId);
  }

  private toResponse(row: LabelRecord): LabelResponse {
    return { id: row.id, name: row.name, color: row.color, createdAt: row.created_at.toISOString() };
  }
}
