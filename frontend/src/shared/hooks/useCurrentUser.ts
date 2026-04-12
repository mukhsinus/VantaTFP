import { useAuthStore } from '@app/store/auth.store';
import type { CurrentUser, Role } from '@shared/types/auth.types';

interface UseCurrentUserResult {
  user: CurrentUser | null;
  role: Role | null;
  isAdmin:    boolean;
  isManager:  boolean;
  isEmployee: boolean;
  /** Platform operator; must not use tenant workspace UI. */
  isSuperAdmin: boolean;
  isAuthenticated: boolean;
}

/**
 * Returns the authenticated user and convenient role flags.
 * Use this instead of reading the store directly to keep role checks consistent.
 */
export function useCurrentUser(): UseCurrentUserResult {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  return {
    user,
    role:            user?.role ?? null,
    isAdmin:         user?.role === 'ADMIN',
    isManager:       user?.role === 'MANAGER',
    isEmployee:      user?.role === 'EMPLOYEE',
    isSuperAdmin:    (user?.systemRole ?? 'user') === 'super_admin',
    isAuthenticated: Boolean(user && accessToken),
  };
}
