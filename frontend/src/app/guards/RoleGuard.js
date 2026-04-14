import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { canAccessRoute, getHomeRouteByRole } from '@shared/config/role-ui';
import { ADMIN_HOME_PATH } from '@shared/config/auth-routing';
import { useAuthStore } from '@app/store/auth.store';
import { AppLoadingScreen } from './AppLoadingScreen';
export function RoleGuard({ path, children }) {
    const isSessionLoading = useAuthStore((s) => s.isSessionLoading);
    const user = useAuthStore((s) => s.user);
    const { role, isSuperAdmin } = useCurrentUser();
    if (isSessionLoading && !user) {
        return _jsx(AppLoadingScreen, {});
    }
    if (!role)
        return null;
    if (isSuperAdmin) {
        return _jsx(Navigate, { to: ADMIN_HOME_PATH, replace: true });
    }
    if (!canAccessRoute(role, path)) {
        return _jsx(Navigate, { to: getHomeRouteByRole(role), replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
