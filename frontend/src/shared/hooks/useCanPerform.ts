import type { Role } from '@shared/types/auth.types';
import { useCurrentUser } from './useCurrentUser';

// ─── Permission registry ──────────────────────────────────────────────────────
// Map every UI action to the roles that are allowed to perform it.
// Add entries here when new features require access control.

type Permission =
  | 'task:create'
  | 'task:delete'
  | 'task:assign'
  | 'task:changeStatus'
  | 'employee:invite'
  | 'employee:changeRole'
  | 'employee:deactivate'
  | 'employee:manage'
  | 'kpi:create'
  | 'kpi:delete'
  | 'payroll:view'
  | 'payroll:create'
  | 'payroll:approve'
  | 'tenant:manage';

const PERMISSION_MAP: Record<Permission, Role[]> = {
  'task:create':       ['ADMIN', 'MANAGER'],
  'task:delete':       ['ADMIN', 'MANAGER'],
  'task:assign':       ['ADMIN', 'MANAGER'],
  'task:changeStatus': ['ADMIN', 'MANAGER', 'EMPLOYEE'],

  'employee:invite':   ['ADMIN'],
  /** Owner only (JWT role ADMIN = tenant owner). */
  'employee:changeRole': ['ADMIN'],
  'employee:deactivate': ['ADMIN', 'MANAGER'],
  /** Legacy: prefer `employee:changeRole` / `employee:deactivate`. */
  'employee:manage':   ['ADMIN'],

  'kpi:create':        ['ADMIN', 'MANAGER'],
  'kpi:delete':        ['ADMIN'],

  'payroll:view':      ['ADMIN', 'EMPLOYEE'],
  'payroll:create':    ['ADMIN'],
  'payroll:approve':   ['ADMIN'],

  'tenant:manage':     ['ADMIN'],
};

/**
 * Returns a boolean indicating whether the current user may perform an action.
 *
 * Usage:
 *   const canCreate = useCanPerform('task:create');
 *   {canCreate && <Button>New Task</Button>}
 */
export function useCanPerform(permission: Permission): boolean {
  const { role } = useCurrentUser();
  if (!role) return false;
  return PERMISSION_MAP[permission].includes(role);
}

/**
 * Returns a `can(permission)` function — useful when checking multiple
 * permissions in one component without multiple hook calls.
 *
 * Usage:
 *   const { can } = usePermissions();
 *   {can('task:create') && <Button>New Task</Button>}
 *   {can('payroll:approve') && <Button>Approve</Button>}
 */
export function usePermissions(): { can: (permission: Permission) => boolean } {
  const { role } = useCurrentUser();
  return {
    can: (permission: Permission) => {
      if (!role) return false;
      return PERMISSION_MAP[permission].includes(role);
    },
  };
}
