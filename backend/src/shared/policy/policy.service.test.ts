import { describe, expect, it, vi } from 'vitest';
import { PolicyService } from './policy.service.js';
import type { PolicyRepository } from './policy.repository.js';

describe('PolicyService role code compatibility', () => {
  it('maps legacy ADMIN role code to canonical owner role', async () => {
    const repo = {
      findRoleByCode: vi.fn()
        .mockResolvedValueOnce(null) // ADMIN
        .mockResolvedValueOnce(null) // admin
        .mockResolvedValueOnce({ id: 'role-owner' }), // owner
      findRolePermissions: vi.fn().mockResolvedValue([{ action: 'read', resource: 'tasks' }]),
    } as unknown as PolicyRepository;

    const service = new PolicyService(repo);
    const allowed = await service.checkPermission(
      'tenant-1',
      'ADMIN',
      'read',
      'tasks'
    );

    expect(allowed).toBe(true);
  });

  it('maps canonical owner role code to legacy ADMIN role', async () => {
    const repo = {
      findRoleByCode: vi.fn()
        .mockResolvedValueOnce(null) // owner
        .mockResolvedValueOnce(null) // OWNER
        .mockResolvedValueOnce({ id: 'role-admin' }), // ADMIN
      findRolePermissions: vi.fn().mockResolvedValue([{ action: 'read', resource: 'tasks' }]),
    } as unknown as PolicyRepository;

    const service = new PolicyService(repo);
    const allowed = await service.checkPermission(
      'tenant-1',
      'owner',
      'read',
      'tasks'
    );

    expect(allowed).toBe(true);
  });

  it('allows manage:all wildcard permission', async () => {
    const repo = {
      findRoleByCode: vi.fn().mockResolvedValue({ id: 'role-admin' }),
      findRolePermissions: vi.fn().mockResolvedValue([{ action: 'manage', resource: 'all' }]),
    } as unknown as PolicyRepository;

    const service = new PolicyService(repo);
    const allowed = await service.checkPermission(
      'tenant-1',
      'owner',
      'write',
      'reports'
    );

    expect(allowed).toBe(true);
  });

  it('denies when permission is absent', async () => {
    const repo = {
      findRoleByCode: vi.fn().mockResolvedValue({ id: 'role-employee' }),
      findRolePermissions: vi.fn().mockResolvedValue([{ action: 'read', resource: 'tasks' }]),
    } as unknown as PolicyRepository;

    const service = new PolicyService(repo);
    const allowed = await service.checkPermission(
      'tenant-1',
      'employee',
      'read',
      'payroll'
    );

    expect(allowed).toBe(false);
  });
});
