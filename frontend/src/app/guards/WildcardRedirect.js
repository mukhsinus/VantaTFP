import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { getHomeRouteByRole } from '@shared/config/role-ui';
import { ADMIN_HOME_PATH } from '@shared/config/auth-routing';
export function WildcardRedirect() {
    const { role, isSuperAdmin } = useCurrentUser();
    if (!role)
        return _jsx(Navigate, { to: "/login", replace: true });
    if (isSuperAdmin)
        return _jsx(Navigate, { to: ADMIN_HOME_PATH, replace: true });
    return _jsx(Navigate, { to: getHomeRouteByRole(role), replace: true });
}
