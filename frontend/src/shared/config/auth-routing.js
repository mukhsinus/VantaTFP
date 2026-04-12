import { getHomeRouteByRole } from '@shared/config/role-ui';
export const ADMIN_HOME_PATH = '/admin/dashboard';
/**
 * After login (or when already authenticated on /login), choose a safe destination.
 * Super admins never land in tenant chrome; tenant users cannot open /admin.
 */
export function resolvePostLoginRedirect(user, redirectParam) {
    const raw = redirectParam?.trim();
    const safe = raw && raw.startsWith('/') && raw !== '/login' && !raw.startsWith('/login?') ? raw : null;
    if ((user.systemRole ?? 'user') === 'super_admin') {
        if (safe?.startsWith('/admin'))
            return safe;
        return ADMIN_HOME_PATH;
    }
    if (safe?.startsWith('/admin')) {
        return getHomeRouteByRole(user.role);
    }
    return safe ?? getHomeRouteByRole(user.role);
}
