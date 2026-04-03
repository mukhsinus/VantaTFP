import { TenantsRepository } from './tenants.repository.js';
import { CreateTenantDto, UpdateTenantDto } from './tenants.schema.js';

export class TenantsService {
  constructor(private readonly tenantsRepository: TenantsRepository) {}

  async getAllTenants() {
    throw new Error('Not implemented');
  }

  async getTenantById(_tenantId: string) {
    throw new Error('Not implemented');
  }

  async createTenant(_data: CreateTenantDto) {
    throw new Error('Not implemented');
  }

  async updateTenant(_tenantId: string, _data: UpdateTenantDto) {
    throw new Error('Not implemented');
  }

  async deactivateTenant(_tenantId: string) {
    throw new Error('Not implemented');
  }
}
