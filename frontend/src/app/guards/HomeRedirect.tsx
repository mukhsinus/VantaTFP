import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { getHomeRouteByRole } from '@shared/config/role-ui';

export function HomeRedirect() {
  const { role } = useCurrentUser();
  if (!role) return <Navigate to="/login" replace />;
  return <Navigate to={getHomeRouteByRole(role)} replace />;
}
