import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { getHomeRouteByRole } from '@shared/config/role-ui';
import { useAuthStore } from '@app/store/auth.store';
import { AppLoadingScreen } from './AppLoadingScreen';

/** Only `system_role === super_admin` may render child routes (platform admin panel). */
export function SuperAdminGuard() {
  const isSessionLoading = useAuthStore((s) => s.isSessionLoading);
  const user = useAuthStore((s) => s.user);
  const { role, isSuperAdmin } = useCurrentUser();

  if (isSessionLoading && !user) {
    return <AppLoadingScreen />;
  }

  if (!role) return null;

  if (!isSuperAdmin) {
    return <Navigate to={getHomeRouteByRole(role)} replace />;
  }

  return <Outlet />;
}
