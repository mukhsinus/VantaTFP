import { TenantsRepository, TenantRecord } from './tenants.repository.js';
import { CreateTenantDto, UpdateTenantDto } from './tenants.schema.js';
import { ApplicationError } from '../../shared/utils/application-error.js';

export interface TenantResponse {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasMore: boolean;
}

export interface TenantListResponse {
  data: TenantResponse[];
  pagination: PaginationMeta;
}

export class TenantsService {
  constructor(private readonly tenantsRepository: TenantsRepository) {}

  async getAllTenants(): Promise<TenantResponse[]> {
    const tenants = await this.tenantsRepository.findAll();
    return tenants.map(this.toResponse);
  }

  async listTenants(page: number = 1, limit: number = 20): Promise<TenantListResponse> {
    const tenants = await this.tenantsRepository.findAllPaginated(page, limit);
    const total = await this.tenantsRepository.count();
    const pages = Math.ceil(total / limit);

    return {
      data: tenants.map(this.toResponse),
      pagination: {
        total,
        page,
        limit,
        pages,
        hasMore: page < pages,
      },
    };
  }

  async getTenantById(tenantId: string): Promise<TenantResponse> {
    const tenant = await this.tenantsRepository.findById(tenantId);
    if (!tenant) {
      throw ApplicationError.notFound('Tenant');
    }
    return this.toResponse(tenant);
  }

  async createTenant(data: CreateTenantDto): Promise<TenantResponse> {
    // Verify slug is unique
    const existing = await this.tenantsRepository.findBySlug(data.slug);
    if (existing) {
      throw ApplicationError.conflict(`Slug '${data.slug}' is already taken`);
    }

    const tenant = await this.tenantsRepository.create({
      name: data.name,
      slug: data.slug,
      plan: data.plan ?? 'FREE',
      is_active: true,
    });

    return this.toResponse(tenant);
  }

  async updateTenant(tenantId: string, data: UpdateTenantDto): Promise<TenantResponse> {
    const tenant = await this.tenantsRepository.findById(tenantId);
    if (!tenant) {
      throw ApplicationError.notFound('Tenant');
    }

    const updated = await this.tenantsRepository.update(tenantId, data);
    return this.toResponse(updated);
  }

  async deactivateTenant(tenantId: string): Promise<void> {
    const tenant = await this.tenantsRepository.findById(tenantId);
    if (!tenant) {
      throw ApplicationError.notFound('Tenant');
    }

    await this.tenantsRepository.deactivate(tenantId);
  }

  private toResponse(tenant: TenantRecord): TenantResponse {
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      isActive: tenant.is_active,
      createdAt: tenant.created_at.toISOString(),
      updatedAt: tenant.updated_at.toISOString(),
    };
  }
}
