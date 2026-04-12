import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { getHomeRouteByRole } from '@shared/config/role-ui';
import { ADMIN_HOME_PATH } from '@shared/config/auth-routing';

export function HomeRedirect() {
  const { role, isSuperAdmin } = useCurrentUser();
  if (!role) return <Navigate to="/login" replace />;
  if (isSuperAdmin) return <Navigate to={ADMIN_HOME_PATH} replace />;
  return <Navigate to={getHomeRouteByRole(role)} replace />;
}
