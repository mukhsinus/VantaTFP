import { describe, expect, it, vi } from 'vitest';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { requireRole, requireTenantRole, requireTenantOwnerStrict } from './rbac.middleware.js';

function buildRequest(partial: Partial<FastifyRequest>): FastifyRequest {
  return {
    params: {},
    ...partial,
  } as FastifyRequest;
}

const reply = {} as FastifyReply;

describe('rbac middleware', () => {
  it('allows policy-based role check when permission exists', async () => {
    const checkPermission = vi.fn().mockResolvedValue(true);
    const guard = requireRole('read', 'tasks');
    const request = buildRequest({
      tenantId: 'tenant-1',
      user: {
        system_role: 'user',
        tenant_role: 'manager',
        role: 'ADMIN',
      } as FastifyRequest['user'],
      server: {
        policy: { checkPermission },
      } as unknown as FastifyRequest['server'],
    });

    await expect(guard(request, reply)).resolves.toBeUndefined();
    expect(checkPermission).toHaveBeenCalledWith('tenant-1', 'manager', 'read', 'tasks');
  });

  it('rejects policy-based role check when tenant context is missing', async () => {
    const guard = requireRole('read', 'tasks');
    const request = buildRequest({
      user: {
        system_role: 'user',
        tenant_role: 'owner',
        tenant_id: null,
        tenantId: '',
        role: 'ADMIN',
      } as FastifyRequest['user'],
      server: {
        policy: { checkPermission: vi.fn() },
      } as unknown as FastifyRequest['server'],
    });

    await expect(guard(request, reply)).rejects.toThrow('Tenant context required');
  });

  it('enforces owner-only strict guard for non-owner users', async () => {
    const guard = requireTenantOwnerStrict();
    const request = buildRequest({
      user: {
        system_role: 'user',
        tenant_role: 'manager',
        tenant_id: 'tenant-1',
      } as FastifyRequest['user'],
    });

    await expect(guard(request, reply)).rejects.toThrow(
      'Only the tenant owner can perform this action'
    );
  });

  it('allows tenant role guard for explicitly allowed roles', async () => {
    const guard = requireTenantRole('owner', 'manager');
    const request = buildRequest({
      user: {
        system_role: 'user',
        tenant_role: 'manager',
      } as FastifyRequest['user'],
    });

    await expect(guard(request, reply)).resolves.toBeUndefined();
  });
});
