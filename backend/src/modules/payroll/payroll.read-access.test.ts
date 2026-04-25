import { describe, expect, it } from 'vitest';
import { payrollReadBypassesTenantPolicy } from './payroll.read-access.js';
import type { AuthenticatedUser } from '../../shared/types/common.types.js';

function user(partial: Partial<AuthenticatedUser>): AuthenticatedUser {
  return {
    id: 'u1',
    userId: 'u1',
    system_role: 'user',
    tenant_role: 'owner',
    tenant_id: 't1',
    tenantId: 't1',
    email: 'a@test.com',
    role: 'ADMIN',
    tenantPlan: null,
    ...partial,
  };
}

describe('payrollReadBypassesTenantPolicy', () => {
  it('returns true for tenant employee by tenant_role', () => {
    expect(payrollReadBypassesTenantPolicy(user({ tenant_role: 'employee', role: 'EMPLOYEE' }))).toBe(
      true
    );
  });

  it('returns true when role is EMPLOYEE even if tenant_role is null', () => {
    expect(payrollReadBypassesTenantPolicy(user({ tenant_role: null, role: 'EMPLOYEE' }))).toBe(true);
  });

  it('returns false for owner without super_admin', () => {
    expect(payrollReadBypassesTenantPolicy(user({ tenant_role: 'owner', role: 'ADMIN' }))).toBe(false);
  });

  it('returns true for super_admin', () => {
    expect(
      payrollReadBypassesTenantPolicy(
        user({ system_role: 'super_admin', tenant_role: null, tenant_id: null, tenantId: '' })
      )
    ).toBe(true);
  });
});
