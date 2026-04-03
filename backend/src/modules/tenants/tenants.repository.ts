import { Pool } from 'pg';

export interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class TenantsRepository {
  constructor(private readonly db: Pool) {}

  async findAll(): Promise<TenantRecord[]> {
    throw new Error('Not implemented');
  }

  async findById(_tenantId: string): Promise<TenantRecord | null> {
    throw new Error('Not implemented');
  }

  async findBySlug(_slug: string): Promise<TenantRecord | null> {
    throw new Error('Not implemented');
  }

  async create(_data: Omit<TenantRecord, 'id' | 'created_at' | 'updated_at'>): Promise<TenantRecord> {
    throw new Error('Not implemented');
  }

  async update(
    _tenantId: string,
    _data: Partial<Pick<TenantRecord, 'name' | 'plan'>>
  ): Promise<TenantRecord> {
    throw new Error('Not implemented');
  }

  async deactivate(_tenantId: string): Promise<void> {
    throw new Error('Not implemented');
  }
}
