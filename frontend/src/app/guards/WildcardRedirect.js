import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { getHomeRouteByRole } from '@shared/config/role-ui';
import { ADMIN_HOME_PATH } from '@shared/config/auth-routing';
import { useAuthStore } from '@app/store/auth.store';
import { AppLoadingScreen } from './AppLoadingScreen';
export function WildcardRedirect() {
    const isSessionLoading = useAuthStore((s) => s.isSessionLoading);
    const user = useAuthStore((s) => s.user);
    const { role, isSuperAdmin } = useCurrentUser();
    if (isSessionLoading && !user) {
        return _jsx(AppLoadingScreen, {});
    }
    if (!role)
        return _jsx(Navigate, { to: "/login", replace: true });
    if (isSuperAdmin)
        return _jsx(Navigate, { to: ADMIN_HOME_PATH, replace: true });
    return _jsx(Navigate, { to: getHomeRouteByRole(role), replace: true });
}
