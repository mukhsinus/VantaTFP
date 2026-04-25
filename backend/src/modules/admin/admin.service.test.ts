import { describe, expect, it, vi } from 'vitest';
import type { AdminRepository } from './admin.repository.js';
import type { BillingRepository } from '../billing/billing.repository.js';

process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/tfp_test';
process.env.JWT_SECRET ??= 'test-secret-123456789012345678901234567890';

async function createService() {
  const { AdminService } = await import('./admin.service.js');
  const adminRepository = {
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
      getUserById: ReturnType<typeof vi.fn>;
      updateUserRole: ReturnType<typeof vi.fn>;
      upsertTenantRoleForUser: ReturnType<typeof vi.fn>;
      banUser: ReturnType<typeof vi.fn>;
    },
  };
}

describe('AdminService user protection rules', () => {
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
