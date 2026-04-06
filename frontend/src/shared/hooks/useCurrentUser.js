import { useAuthStore } from '@app/store/auth.store';
/**
 * Returns the authenticated user and convenient role flags.
 * Use this instead of reading the store directly to keep role checks consistent.
 */
export function useCurrentUser() {
    const user = useAuthStore((s) => s.user);
    const accessToken = useAuthStore((s) => s.accessToken);
    return {
        user,
        role: user?.role ?? null,
        isAdmin: user?.role === 'ADMIN',
        isManager: user?.role === 'MANAGER',
        isEmployee: user?.role === 'EMPLOYEE',
        isAuthenticated: Boolean(user && accessToken),
    };
}
