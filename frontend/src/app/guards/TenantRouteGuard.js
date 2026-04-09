import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { ADMIN_HOME_PATH } from '@shared/config/auth-routing';
/**
 * Tenant workspace shell (sidebar, tasks, billing, …).
 * Platform super admins are redirected to the admin panel and never see tenant chrome.
 */
export function TenantRouteGuard() {
    const { role, isSuperAdmin } = useCurrentUser();
    if (!role)
        return null;
    if (isSuperAdmin) {
        return _jsx(Navigate, { to: ADMIN_HOME_PATH, replace: true });
    }
    return _jsx(Outlet, {});
}
