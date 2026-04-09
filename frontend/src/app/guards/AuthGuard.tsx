import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@app/store/auth.store';
import { AppLoadingScreen } from './AppLoadingScreen';

/**
 * Route-level authentication guard.
 *
 * Render order:
 *  1. isHydrated = false     → full-screen loader (prevents flicker)
 *  2. isSessionLoading       → full-screen loader (bootstrap / session work)
 *  3. no tokens              → redirect to /login
 *  4. tokens (user may lag)  → render child routes; AppLayout shows skeleton until user is set
 */
export function AuthGuard() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isSessionLoading = useAuthStore((s) => s.isSessionLoading);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const location = useLocation();

  console.log('AUTH STATE', {
    tokens: { accessToken: Boolean(accessToken), refreshToken: Boolean(refreshToken) },
    user,
    isSessionLoading,
  });

  if (!isHydrated) {
    return <AppLoadingScreen />;
  }

  if (isSessionLoading) {
    return <AppLoadingScreen />;
  }

  if (!accessToken && !refreshToken) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <Outlet />;
}
