import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@app/store/auth.store';
import { AppLoadingScreen } from './AppLoadingScreen';

/**
 * Route-level authentication guard.
 *
 * Render order:
 *  1. isHydrated = false  → full-screen loader (prevents flicker)
 *  2. no token / no user  → redirect to /login, preserving the current path
 *     so the user is returned to their destination after sign-in
 *  3. authenticated       → render child routes via <Outlet />
 *
 * Usage in router:
 *   { element: <AuthGuard />, children: [ ... protected routes ... ] }
 */
export function AuthGuard() {
  const isHydrated  = useAuthStore((s) => s.isHydrated);
  const isSessionLoading = useAuthStore((s) => s.isSessionLoading);
  const user        = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const location    = useLocation();

  // ① Wait for Zustand to finish reading localStorage — no redirect yet
  if (!isHydrated || isSessionLoading || ((accessToken || refreshToken) && !user)) {
    return <AppLoadingScreen />;
  }

  // ② Not authenticated — send to /login with a redirect hint
  if (!user || (!accessToken && !refreshToken)) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  // ③ Authenticated — render nested routes
  return <Outlet />;
}
