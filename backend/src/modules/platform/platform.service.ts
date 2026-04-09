import { PlatformRepository } from './platform.repository.js';

function paginate<T>(rows: T[], total: number, page: number, limit: number) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return {
    data: rows,
    pagination: {
      total,
      page,
      limit,
      pages,
      hasMore: page < pages,
    },
  };
}

export class PlatformService {
  constructor(private readonly repo: PlatformRepository) {}

  async listTenants(page: number, limit: number) {
    const { rows, total } = await this.repo.listTenants(page, limit);
    return paginate(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        plan: r.plan,
        isActive: r.is_active,
        createdAt: r.created_at.toISOString(),
        updatedAt: r.updated_at.toISOString(),
      })),
      total,
      page,
      limit
    );
  }

  async listUsers(page: number, limit: number) {
    const { rows, total } = await this.repo.listUsers(page, limit);
    return paginate(
      rows.map((r) => ({
        id: r.id,
        email: r.email,
        firstName: r.first_name,
        lastName: r.last_name,
        role: r.role,
        systemRole: r.system_role,
        tenantId: r.tenant_id,
        tenantName: r.tenant_name,
        createdAt: r.created_at.toISOString(),
      })),
      total,
      page,
      limit
    );
  }

  async listSubscriptions(page: number, limit: number) {
    const { rows, total } = await this.repo.listSubscriptions(page, limit);
    return paginate(
      rows.map((r) => ({
        tenantId: r.tenant_id,
        tenantName: r.tenant_name,
        status: r.status,
        planTier: r.plan_tier,
        planName: r.plan_name,
        maxUsers: r.max_users,
      })),
      total,
      page,
      limit
    );
  }
}
