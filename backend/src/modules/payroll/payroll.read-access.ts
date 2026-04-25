import type { AuthenticatedUser } from '../../shared/types/common.types.js';

/**
 * Payroll list/detail/records are tenant-scoped in the controller for employees.
 * They must not depend on DB policy rows for `read:payroll` (often missing for employee role).
 */
export function payrollReadBypassesTenantPolicy(user: AuthenticatedUser): boolean {
  if (user.system_role === 'super_admin') {
    return true;
  }
  return user.tenant_role === 'employee' || user.role === 'EMPLOYEE';
}
