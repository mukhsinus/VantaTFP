import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { getHomeRouteByRole } from '@shared/config/role-ui';

/** Only `system_role === super_admin` may render child routes (platform admin panel). */
export function SuperAdminGuard() {
  const { role, isSuperAdmin } = useCurrentUser();

  if (!role) return null;

  if (!isSuperAdmin) {
    return <Navigate to={getHomeRouteByRole(role)} replace />;
  }

  return <Outlet />;
}
