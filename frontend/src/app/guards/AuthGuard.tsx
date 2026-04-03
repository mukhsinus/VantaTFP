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
  const user        = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const location    = useLocation();

  // ① Wait for Zustand to finish reading localStorage — no redirect yet
  if (!isHydrated) {
    return <AppLoadingScreen />;
  }

  // ② Not authenticated — send to /login with a redirect hint
  if (!user || !accessToken) {
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
