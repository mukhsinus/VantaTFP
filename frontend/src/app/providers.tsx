import React, { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ApiError } from '@shared/api/client';
import { authApi } from '@entities/auth/auth.api';
import { useAuthStore } from '@app/store/auth.store';
import type { CurrentUser } from '@shared/types/auth.types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,       // 1 minute
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.statusCode === 401) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

function normalizeMeResponse(raw: unknown, fallback: CurrentUser | null): CurrentUser | null {
  if (!raw || typeof raw !== 'object') return null;

  const value = raw as Record<string, unknown>;
  const userId = (value.userId as string | undefined) ?? (value.id as string | undefined);
  const tenantId = value.tenantId as string | undefined;
  const email = value.email as string | undefined;
  const firstName = value.firstName as string | undefined;
  const lastName = value.lastName as string | undefined;
  const role = value.role as CurrentUser['role'] | undefined;

  if (!userId || !tenantId || !email || !firstName || !lastName || !role) {
    return null;
  }

  return {
    userId,
    tenantId,
    tenantName: (value.tenantName as string | undefined) ?? fallback?.tenantName ?? 'Tenant',
    email,
    firstName,
    lastName,
    role,
  };
}

function AuthSessionBootstrap() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const existingUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setSessionLoading = useAuthStore((s) => s.setSessionLoading);
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (!isHydrated || bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    if (!accessToken && !refreshToken) {
      setSessionLoading(false);
      return;
    }

    let cancelled = false;
    const bootstrap = async () => {
      setSessionLoading(true);
      try {
        const me = await authApi.me();
        if (cancelled) return;
        const normalized = normalizeMeResponse(me, existingUser);
        if (!normalized) {
          clearAuth();
          return;
        }
        setUser(normalized);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.statusCode === 401) {
          clearAuth();
        }
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [isHydrated, accessToken, refreshToken, existingUser, setUser, clearAuth, setSessionLoading]);

  return null;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionBootstrap />
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
