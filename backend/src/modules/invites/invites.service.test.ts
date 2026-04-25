import { describe, expect, it, vi } from 'vitest';
import { InvitesService } from './invites.service.js';
import type { InvitesRepository } from './invites.repository.js';
import type { AuthRepository } from '../auth/auth.repository.js';
import type { BillingService } from '../billing/billing.service.js';
import type { EmployeesRepository } from '../employees/employees.repository.js';
import type { AuthService } from '../auth/auth.service.js';

function createService() {
  const invitesRepository = {
    insertInvite: vi.fn().mockResolvedValue(undefined),
  } as unknown as InvitesRepository;

  const billing = {
    assertCanAddUser: vi.fn().mockResolvedValue(undefined),
  } as unknown as BillingService;

  const service = new InvitesService(
    invitesRepository,
    {} as AuthRepository,
    billing,
    {} as EmployeesRepository,
    {} as AuthService
  );

  return {
    service,
    invitesRepository: invitesRepository as unknown as {
      insertInvite: ReturnType<typeof vi.fn>;
    },
    billing: billing as unknown as {
      assertCanAddUser: ReturnType<typeof vi.fn>;
    },
  };
}

describe('InvitesService createLinkInvite security', () => {
  it('rejects manager inviting manager role', async () => {
    const { service } = createService();

    await expect(
      service.createLinkInvite(
        'tenant-1',
        { role: 'manager' },
        { system_role: 'user', tenant_role: 'manager' }
      )
    ).rejects.toThrow('Managers can only invite employees');
  });

  it('rejects invite creation when tenant context is missing', async () => {
    const { service } = createService();

    await expect(
      service.createLinkInvite(
        '',
        { role: 'employee' },
        { system_role: 'super_admin', tenant_role: null }
      )
    ).rejects.toThrow('Tenant context required');
  });
});
