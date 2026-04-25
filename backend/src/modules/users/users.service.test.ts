import { describe, expect, it, vi } from 'vitest';
import { UsersService } from './users.service.js';
import type { UsersRepository } from './users.repository.js';
import type { EmployeesRepository } from '../employees/employees.repository.js';
import type { BillingService } from '../billing/billing.service.js';

function createService() {
  const usersRepository = {
    findByIdAndTenant: vi.fn(),
    deactivate: vi.fn(),
  } as unknown as UsersRepository;

  const employeesRepository = {} as EmployeesRepository;
  const billing = {} as BillingService;

  const service = new UsersService(usersRepository, employeesRepository, billing);
  return {
    service,
    usersRepository: usersRepository as unknown as {
      findByIdAndTenant: ReturnType<typeof vi.fn>;
      deactivate: ReturnType<typeof vi.fn>;
    },
  };
}

describe('UsersService tenant isolation and role enforcement', () => {
  it('rejects update when target user is outside actor tenant', async () => {
    const { service, usersRepository } = createService();
    usersRepository.findByIdAndTenant.mockResolvedValue(null);

    await expect(
      service.updateUser(
        'user-2',
        'tenant-1',
        { firstName: 'Alice' },
        {
          actorUserId: 'owner-1',
          actorTenantRole: 'owner',
          actorSystemRole: 'user',
        }
      )
    ).rejects.toThrow('User not found');
  });

  it('rejects deactivate when target user is outside actor tenant', async () => {
    const { service, usersRepository } = createService();
    usersRepository.findByIdAndTenant.mockResolvedValue(null);

    await expect(
      service.deactivateUser('user-2', 'tenant-1', {
        actorUserId: 'owner-1',
        actorTenantRole: 'owner',
        actorSystemRole: 'user',
      })
    ).rejects.toThrow('User not found');
  });

  it('prevents managers from deactivating manager/admin accounts', async () => {
    const { service, usersRepository } = createService();
    usersRepository.findByIdAndTenant.mockResolvedValue({
      id: 'user-2',
      tenant_id: 'tenant-1',
      email: 'manager@example.com',
      password_hash: 'hash',
      first_name: 'Jane',
      last_name: 'Manager',
      role: 'MANAGER',
      manager_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await expect(
      service.deactivateUser('user-2', 'tenant-1', {
        actorUserId: 'manager-1',
        actorTenantRole: 'manager',
        actorSystemRole: 'user',
      })
    ).rejects.toThrow('Managers can only deactivate EMPLOYEE users');
  });
});
