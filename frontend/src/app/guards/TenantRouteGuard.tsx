import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { ADMIN_HOME_PATH } from '@shared/config/auth-routing';
import { useAuthStore } from '@app/store/auth.store';

/**
 * Tenant workspace shell (sidebar, tasks, billing, …).
 * Platform super admins are redirected to the admin panel and never see tenant chrome.
 */
export function TenantRouteGuard() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const { role, isSuperAdmin } = useCurrentUser();

  // Tokens without a hydrated profile cannot render tenant chrome — send to login
  // instead of a permanent blank screen (e.g. partial persist / bootstrap mismatch).
  if ((accessToken || refreshToken) && !user) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !role) {
    return <Navigate to="/login" replace />;
  }

  if (isSuperAdmin) {
    return <Navigate to={ADMIN_HOME_PATH} replace />;
  }

  return <Outlet />;
}
