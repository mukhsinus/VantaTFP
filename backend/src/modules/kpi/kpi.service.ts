import { KpiRepository } from './kpi.repository.js';
import { CreateKpiDto, UpdateKpiDto, RecordKpiProgressDto } from './kpi.schema.js';

export class KpiService {
  constructor(private readonly kpiRepository: KpiRepository) {}

  async listKpis(_tenantId: string) {
    throw new Error('Not implemented');
  }

  async getKpiById(_kpiId: string, _tenantId: string) {
    throw new Error('Not implemented');
  }

  async createKpi(_tenantId: string, _createdByUserId: string, _data: CreateKpiDto) {
    throw new Error('Not implemented');
  }

  async updateKpi(_kpiId: string, _tenantId: string, _data: UpdateKpiDto) {
    throw new Error('Not implemented');
  }

  async deleteKpi(_kpiId: string, _tenantId: string) {
    throw new Error('Not implemented');
  }

  async recordProgress(
    _kpiId: string,
    _tenantId: string,
    _data: RecordKpiProgressDto
  ) {
    throw new Error('Not implemented');
  }

  async getKpiProgress(_kpiId: string, _tenantId: string) {
    throw new Error('Not implemented');
  }
}
