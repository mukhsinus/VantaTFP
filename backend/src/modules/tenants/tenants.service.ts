import { TenantsRepository, TenantRecord } from './tenants.repository.js';
import { CreateTenantDto, UpdateTenantDto } from './tenants.schema.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import type { BillingService } from '../billing/billing.service.js';

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
  constructor(
    private readonly tenantsRepository: TenantsRepository,
    private readonly billing: BillingService
  ) {}

  async getAllTenants(tenantId: string): Promise<TenantResponse[]> {
    const tenants = await this.tenantsRepository.findAllForTenant(tenantId);
    return tenants.map(this.toResponse);
  }

  async listTenants(
    tenantId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<TenantListResponse> {
    const tenants = await this.tenantsRepository.findPaginatedForTenant(tenantId, page, limit);
    const total = await this.tenantsRepository.countForTenant(tenantId);
    const pages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

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

  async listCurrentTenant(
    tenantId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<TenantListResponse> {
    const tenant = await this.tenantsRepository.findActiveById(tenantId);
    const data = tenant ? [this.toResponse(tenant)] : [];

    return {
      data,
      pagination: {
        total: data.length,
        page,
        limit,
        pages: data.length > 0 ? 1 : 0,
        hasMore: false,
      },
    };
  }

  async getTenantById(tenantId: string, requestTenantId: string): Promise<TenantResponse> {
    const tenant = await this.tenantsRepository.findById(tenantId);
    if (!tenant) {
      throw ApplicationError.notFound('Tenant');
    }
    if (tenant.id !== requestTenantId) {
      throw ApplicationError.forbidden('Cross-tenant access denied');
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

    await this.billing.ensureSubscriptionForNewTenant(tenant.id);

    return this.toResponse(tenant);
  }

  async updateTenant(
    tenantId: string,
    requestTenantId: string,
    data: UpdateTenantDto
  ): Promise<TenantResponse> {
    if (tenantId !== requestTenantId) {
      throw ApplicationError.forbidden('Cross-tenant access denied');
    }
    const tenant = await this.tenantsRepository.findById(tenantId);
    if (!tenant) {
      throw ApplicationError.notFound('Tenant');
    }

    const updated = await this.tenantsRepository.update(tenantId, data);
    return this.toResponse(updated);
  }

  async deactivateTenant(tenantId: string, requestTenantId: string): Promise<void> {
    if (tenantId !== requestTenantId) {
      throw ApplicationError.forbidden('Cross-tenant access denied');
    }
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
