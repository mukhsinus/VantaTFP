import { describe, expect, it, vi } from 'vitest';
import type { AdminRepository } from './admin.repository.js';
import type { BillingRepository } from '../billing/billing.repository.js';

process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/tfp_test';
process.env.JWT_SECRET ??= 'test-secret-123456789012345678901234567890';

async function createService() {
  const { AdminService } = await import('./admin.service.js');
  const adminRepository = {
    listSubscriptions: vi.fn(),
    listPaymentRequests: vi.fn(),
    listUsers: vi.fn(),
    getDashboardStats: vi.fn(),
    getUserById: vi.fn(),
    updateUserRole: vi.fn(),
    upsertTenantRoleForUser: vi.fn(),
    banUser: vi.fn(),
  } as unknown as AdminRepository;

  const service = new AdminService(
    adminRepository,
    new Date('2026-01-01T00:00:00.000Z'),
    {} as BillingRepository
  );

  return {
    service,
    adminRepository: adminRepository as unknown as {
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
    });

    await expect(service.updateUserRole('u1', 'MANAGER')).rejects.toThrow(
      'Cannot change role for super admin accounts'
    );
  });

  it('prevents banning super admin users', async () => {
    const { service, adminRepository } = await createService();
    adminRepository.getUserById.mockResolvedValue({
      id: 'u1',
      tenant_id: null,
      system_role: 'super_admin',
    });

    await expect(service.banUser('u1')).rejects.toThrow('Cannot ban super admin accounts');
  });
});
