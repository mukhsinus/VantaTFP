import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { getHomeRouteByRole } from '@shared/config/role-ui';
/** Only `system_role === super_admin` may render child routes (platform admin panel). */
export function SuperAdminGuard() {
    const { role, isSuperAdmin } = useCurrentUser();
    if (!role)
        return null;
    if (!isSuperAdmin) {
        return _jsx(Navigate, { to: getHomeRouteByRole(role), replace: true });
    }
    return _jsx(Outlet, {});
}
