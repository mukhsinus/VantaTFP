import { Pool } from 'pg';

export interface KpiRecord {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  target_value: number;
  unit: string;
  period: string;
  assignee_id: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface KpiProgressRecord {
  id: string;
  kpi_id: string;
  tenant_id: string;
  actual_value: number;
  recorded_at: Date;
  notes: string | null;
  created_at: Date;
}

export class KpiRepository {
  constructor(private readonly db: Pool) {}

  async findAllByTenant(_tenantId: string): Promise<KpiRecord[]> {
    throw new Error('Not implemented');
  }

  async findByIdAndTenant(_kpiId: string, _tenantId: string): Promise<KpiRecord | null> {
    throw new Error('Not implemented');
  }

  async create(_data: Omit<KpiRecord, 'id' | 'created_at' | 'updated_at'>): Promise<KpiRecord> {
    throw new Error('Not implemented');
  }

  async update(
    _kpiId: string,
    _tenantId: string,
    _data: Partial<Pick<KpiRecord, 'name' | 'description' | 'target_value' | 'unit' | 'period'>>
  ): Promise<KpiRecord> {
    throw new Error('Not implemented');
  }

  async delete(_kpiId: string, _tenantId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async recordProgress(
    _data: Omit<KpiProgressRecord, 'id' | 'created_at'>
  ): Promise<KpiProgressRecord> {
    throw new Error('Not implemented');
  }

  async findProgressByKpi(_kpiId: string, _tenantId: string): Promise<KpiProgressRecord[]> {
    throw new Error('Not implemented');
  }
}
