import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { canAccessRoute, getHomeRouteByRole } from '@shared/config/role-ui';
import { ADMIN_HOME_PATH } from '@shared/config/auth-routing';

interface RoleGuardProps {
  path: string;
  children: React.ReactNode;
}

export function RoleGuard({ path, children }: RoleGuardProps) {
  const { role, isSuperAdmin } = useCurrentUser();
  if (!role) return null;

  if (isSuperAdmin) {
    return <Navigate to={ADMIN_HOME_PATH} replace />;
  }

  if (!canAccessRoute(role, path)) {
    return <Navigate to={getHomeRouteByRole(role)} replace />;
  }

  return <>{children}</>;
}
