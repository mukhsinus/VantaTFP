import { useAuthStore } from '@app/store/auth.store';
/**
 * Hook to check if current user is a super admin
 */
export function useSuperAdmin() {
    const user = useAuthStore((s) => s.user);
    const isSuperAdmin = user?.isSuperAdmin || false;
    return {
        isSuperAdmin,
        canManageTenants: isSuperAdmin,
    };
}
