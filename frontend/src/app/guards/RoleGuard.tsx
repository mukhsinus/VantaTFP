import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { canAccessRoute, getHomeRouteByRole } from '@shared/config/role-ui';

interface RoleGuardProps {
  path: string;
  children: React.ReactNode;
}

export function RoleGuard({ path, children }: RoleGuardProps) {
  const { role } = useCurrentUser();
  if (!role) return null;

  if (!canAccessRoute(role, path)) {
    return <Navigate to={getHomeRouteByRole(role)} replace />;
  }

  return <>{children}</>;
}
