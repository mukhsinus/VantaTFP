import { Pool } from 'pg';

// Placeholder types — will be replaced with full domain models in implementation phase
export interface UserRecord {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: Date;
}

export class AuthRepository {
  constructor(private readonly db: Pool) {}

  // Stub: will query users table scoped by tenant_id
  async findUserByEmailAndTenant(
    _email: string,
    _tenantId: string
  ): Promise<UserRecord | null> {
    throw new Error('Not implemented');
  }

  async findUserById(_userId: string, _tenantId: string): Promise<UserRecord | null> {
    throw new Error('Not implemented');
  }

  async createUser(_data: Omit<UserRecord, 'id' | 'created_at'>): Promise<UserRecord> {
    throw new Error('Not implemented');
  }
}
