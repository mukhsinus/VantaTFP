import { describe, expect, it, vi } from 'vitest';
import type { AdminRepository } from './admin.repository.js';
import type { BillingRepository } from '../billing/billing.repository.js';

process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/tfp_test';
process.env.JWT_SECRET ??= 'test-secret-123456789012345678901234567890';

async function createService() {
  const { AdminService } = await import('./admin.service.js');
  const adminRepository = {
    getTenant: vi.fn(),
    setTenantActiveState: vi.fn(),
    insertAuditLog: vi.fn(),
    listSubscriptions: vi.fn(),
    listPaymentRequests: vi.fn(),
    listUsers: vi.fn(),
    getDashboardStats: vi.fn(),
    getUserById: vi.fn(),
    updateUserRole: vi.fn(),
    upsertTenantRoleForUser: vi.fn(),
    banUser: vi.fn(),
  } as unknown as AdminRepository;
  const billingRepository = {
    upgradeSubscriptionToPlan: vi.fn(),
  } as unknown as BillingRepository;

  const service = new AdminService(
    adminRepository,
    new Date('2026-01-01T00:00:00.000Z'),
    billingRepository
  );

  return {
    service,
    billingRepository: billingRepository as unknown as {
      upgradeSubscriptionToPlan: ReturnType<typeof vi.fn>;
    },
    adminRepository: adminRepository as unknown as {
      getTenant: ReturnType<typeof vi.fn>;
      setTenantActiveState: ReturnType<typeof vi.fn>;
      insertAuditLog: ReturnType<typeof vi.fn>;
      listSubscriptions: ReturnType<typeof vi.fn>;
      listPaymentRequests: ReturnType<typeof vi.fn>;
      listUsers: ReturnType<typeof vi.fn>;
      getDashboardStats: ReturnType<typeof vi.fn>;
      getUserById: ReturnType<typeof vi.fn>;
      updateUserRole: ReturnType<typeof vi.fn>;
      upsertTenantRoleForUser: ReturnType<typeof vi.fn>;
      banUser: ReturnType<typeof vi.fn>;
    },
  };
}

describe('AdminService user protection rules', () => {
  it('forwards tenant scope when listing admin entities', async () => {
    const { service, adminRepository } = await createService();
    adminRepository.listSubscriptions.mockResolvedValue({ rows: [], total: 0 });
    adminRepository.listPaymentRequests.mockResolvedValue({ rows: [], total: 0 });
    adminRepository.listUsers.mockResolvedValue({ rows: [], total: 0 });
    adminRepository.getDashboardStats.mockResolvedValue({
      total_tenants: 1,
      active_subscriptions: 1,
      pending_payments: 0,
      mrr: 10,
    });

    const query = { page: 1, limit: 20, tenantId: 'b713a2ec-9d2e-445f-bab0-03e4f8d643b4' as const };
    await service.listSubscriptions(query);
    await service.listPayments({ ...query, status: 'pending' as const });
    await service.listUsers(query);
    await service.getDashboardSummary(query.tenantId);

    expect(adminRepository.listSubscriptions).toHaveBeenCalledWith(1, 20, query.tenantId);
    expect(adminRepository.listPaymentRequests).toHaveBeenCalledWith('pending', query.tenantId, 1, 20);
    expect(adminRepository.listUsers).toHaveBeenCalledWith(1, 20, query.tenantId);
    expect(adminRepository.getDashboardStats).toHaveBeenCalledWith(query.tenantId);
  });

  it('prevents role update for super admin users', async () => {
    const { service, adminRepository } = await createService();
    adminRepository.getUserById.mockResolvedValue({
      id: 'u1',
      tenant_id: null,
      system_role: 'super_admin',
      role: 'ADMIN',
    });

    await expect(service.updateUserRole('u1', 'MANAGER', 'actor-1')).rejects.toThrow(
      'Cannot change role for super admin accounts'
    );
  });

  it('prevents banning super admin users', async () => {
    const { service, adminRepository } = await createService();
    adminRepository.getUserById.mockResolvedValue({
      id: 'u1',
      tenant_id: null,
      system_role: 'super_admin',
      role: 'ADMIN',
    });

    await expect(service.banUser('u1', 'actor-1')).rejects.toThrow('Cannot ban super admin accounts');
  });

  it('supports global admin listing when tenant scope is omitted', async () => {
    const { service, adminRepository } = await createService();
    adminRepository.listSubscriptions.mockResolvedValue({ rows: [], total: 0 });
    adminRepository.listPaymentRequests.mockResolvedValue({ rows: [], total: 0 });
    adminRepository.listUsers.mockResolvedValue({ rows: [], total: 0 });
    adminRepository.getDashboardStats.mockResolvedValue({
      total_tenants: 4,
      active_subscriptions: 3,
      pending_payments: 1,
      mrr: 215,
    });

    const query = { page: 1, limit: 20 };
    await service.listSubscriptions(query);
    await service.listPayments({ ...query, status: 'pending' as const });
    await service.listUsers(query);
    await service.getDashboardSummary();

    expect(adminRepository.listSubscriptions).toHaveBeenCalledWith(1, 20, undefined);
    expect(adminRepository.listPaymentRequests).toHaveBeenCalledWith('pending', undefined, 1, 20);
    expect(adminRepository.listUsers).toHaveBeenCalledWith(1, 20, undefined);
    expect(adminRepository.getDashboardStats).toHaveBeenCalledWith(undefined);
  });

  it('writes audit log when forcing tenant plan change', async () => {
    const { service, adminRepository, billingRepository } = await createService();
    adminRepository.getTenant.mockResolvedValue({
      id: 'b713a2ec-9d2e-445f-bab0-03e4f8d643b4',
      name: 'Acme',
      slug: 'acme',
      plan: 'basic',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
    billingRepository.upgradeSubscriptionToPlan.mockResolvedValue({ updated: true });

    await service.forceChangeTenantPlan(
      'b713a2ec-9d2e-445f-bab0-03e4f8d643b4',
      'pro',
      'actor-1'
    );

    expect(adminRepository.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'b713a2ec-9d2e-445f-bab0-03e4f8d643b4',
        action: 'TENANT_PLAN_FORCED',
        userId: 'actor-1',
      })
    );
  });

  it('writes audit logs when suspending and re-activating tenant', async () => {
    const { service, adminRepository } = await createService();
    adminRepository.getTenant.mockResolvedValue({
      id: 'b713a2ec-9d2e-445f-bab0-03e4f8d643b4',
      name: 'Acme',
      slug: 'acme',
      plan: 'basic',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
    adminRepository.setTenantActiveState.mockResolvedValue(true);

    await service.suspendTenant('b713a2ec-9d2e-445f-bab0-03e4f8d643b4', 'actor-1');
    await service.activateTenant('b713a2ec-9d2e-445f-bab0-03e4f8d643b4', 'actor-1');

    expect(adminRepository.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'b713a2ec-9d2e-445f-bab0-03e4f8d643b4',
        action: 'TENANT_SUSPENDED',
      })
    );
    expect(adminRepository.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'b713a2ec-9d2e-445f-bab0-03e4f8d643b4',
        action: 'TENANT_ACTIVATED',
      })
    );
  });

  it('writes audit log when updating tenant user role', async () => {
    const { service, adminRepository } = await createService();
    adminRepository.getUserById.mockResolvedValue({
      id: 'user-1',
      tenant_id: 'b713a2ec-9d2e-445f-bab0-03e4f8d643b4',
      system_role: 'user',
      role: 'EMPLOYEE',
    });
    adminRepository.updateUserRole.mockResolvedValue(true);

    await service.updateUserRole('user-1', 'MANAGER', 'actor-1');

    expect(adminRepository.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'b713a2ec-9d2e-445f-bab0-03e4f8d643b4',
        action: 'USER_ROLE_UPDATED',
        userId: 'actor-1',
      })
    );
  });

  it('blocks banning platform accounts without tenant context', async () => {
    const { service, adminRepository } = await createService();
    adminRepository.getUserById.mockResolvedValue({
      id: 'platform-user-1',
      tenant_id: null,
      system_role: 'user',
      role: 'ADMIN',
    });

    await expect(service.banUser('platform-user-1', 'actor-1')).rejects.toThrow(
      'Cannot ban platform accounts'
    );
  });

  it('writes audit log when banning tenant user', async () => {
    const { service, adminRepository } = await createService();
    adminRepository.getUserById.mockResolvedValue({
      id: 'user-2',
      tenant_id: 'b713a2ec-9d2e-445f-bab0-03e4f8d643b4',
      system_role: 'user',
      role: 'EMPLOYEE',
    });
    adminRepository.banUser.mockResolvedValue(true);

    await service.banUser('user-2', 'actor-1');

    expect(adminRepository.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'b713a2ec-9d2e-445f-bab0-03e4f8d643b4',
        action: 'USER_BANNED',
        userId: 'actor-1',
      })
    );
  });
});
