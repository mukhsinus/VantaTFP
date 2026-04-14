import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { getHomeRouteByRole } from '@shared/config/role-ui';
import { ADMIN_HOME_PATH } from '@shared/config/auth-routing';
import { useAuthStore } from '@app/store/auth.store';
import { AppLoadingScreen } from './AppLoadingScreen';

export function HomeRedirect() {
  const isSessionLoading = useAuthStore((s) => s.isSessionLoading);
  const user = useAuthStore((s) => s.user);
  const { role, isSuperAdmin } = useCurrentUser();

  if (isSessionLoading && !user) {
    return <AppLoadingScreen />;
  }

  if (!role) return <Navigate to="/login" replace />;
  if (isSuperAdmin) return <Navigate to={ADMIN_HOME_PATH} replace />;
  return <Navigate to={getHomeRouteByRole(role)} replace />;
}
