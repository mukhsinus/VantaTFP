import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { canAccessRoute, getHomeRouteByRole } from '@shared/config/role-ui';
import { ADMIN_HOME_PATH } from '@shared/config/auth-routing';
import { useAuthStore } from '@app/store/auth.store';
import { AppLoadingScreen } from './AppLoadingScreen';

interface RoleGuardProps {
  path: string;
  children: React.ReactNode;
}

export function RoleGuard({ path, children }: RoleGuardProps) {
  const isSessionLoading = useAuthStore((s) => s.isSessionLoading);
  const user = useAuthStore((s) => s.user);
  const { role, isSuperAdmin } = useCurrentUser();

  if (isSessionLoading && !user) {
    return <AppLoadingScreen />;
  }

  if (!role) return null;

  if (isSuperAdmin) {
    return <Navigate to={ADMIN_HOME_PATH} replace />;
  }

  if (!canAccessRoute(role, path)) {
    return <Navigate to={getHomeRouteByRole(role)} replace />;
  }

  return <>{children}</>;
}
