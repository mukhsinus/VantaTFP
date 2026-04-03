import { Pool } from 'pg';

export interface UserRecord {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class UsersRepository {
  constructor(private readonly db: Pool) {}

  async findAllByTenant(_tenantId: string): Promise<UserRecord[]> {
    throw new Error('Not implemented');
  }

  async findByIdAndTenant(_userId: string, _tenantId: string): Promise<UserRecord | null> {
    throw new Error('Not implemented');
  }

  async create(_data: Omit<UserRecord, 'id' | 'created_at' | 'updated_at'>): Promise<UserRecord> {
    throw new Error('Not implemented');
  }

  async update(
    _userId: string,
    _tenantId: string,
    _data: Partial<Pick<UserRecord, 'first_name' | 'last_name' | 'role'>>
  ): Promise<UserRecord> {
    throw new Error('Not implemented');
  }

  async deactivate(_userId: string, _tenantId: string): Promise<void> {
    throw new Error('Not implemented');
  }
}
