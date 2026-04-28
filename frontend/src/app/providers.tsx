import React, { useEffect } from 'react';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ApiError } from '@shared/api/client';
import { authApi } from '@entities/auth/auth.api';
import { useAuthStore } from '@app/store/auth.store';
import { toast } from '@app/store/toast.store';
import { normalizeMeUser } from '@shared/utils/normalize-me-user';
import {
  markBackendReadyFailOpen,
  markBackendReadyFromHealth,
} from '@shared/api/backend-readiness';
import i18n from '@shared/i18n/i18n';
import {
  getCurrentSupportedLanguage,
  getUserLanguage,
  setUserLanguage,
  toSupportedLanguage,
} from '@shared/i18n/language-preferences';

/** Stable key for the current persisted session (access token preferred). */
function sessionBootstrapKey(
  accessToken: string | null,
  refreshToken: string | null
): string | null {
  if (!accessToken && !refreshToken) return null;
  if (accessToken) return `a:${accessToken}`;
  return `r:${refreshToken}`;
}

/** Which session key has finished bootstrap (success or terminal failure). */
let sessionBootstrapCompletedFor: string | null = null;
let sessionBootstrapInFlight: Promise<void> | null = null;

const SESSION_BOOTSTRAP_TIMEOUT_MS = 25_000;

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Request failed. Please try again.';
}

function queryRetry(failureCount: number, error: unknown): boolean {
  const status =
    error instanceof ApiError
      ? error.statusCode
      : (error as { status?: number })?.status;
  if (status === 401) return false;
  if (error instanceof ApiError && error.statusCode === 403) return false;
  return failureCount < 1;
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof ApiError && error.statusCode === 401) return;
      toast.error('Request failed', toErrorMessage(error));
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (error instanceof ApiError && error.statusCode === 401) return;
      toast.error('Action failed', toErrorMessage(error));
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: queryRetry,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: queryRetry,
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

function OverlayLoader() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        background: 'rgba(0,0,0,0.06)',
      }}
    >
      <p
        style={{
          margin: 0,
          padding: '10px 14px',
          borderRadius: 'var(--radius-lg, 8px)',
          background: 'var(--color-bg, #fff)',
          border: '1px solid var(--color-border, #e5e5e5)',
          boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))',
          color: 'var(--color-text-secondary, #666)',
          fontSize: 'var(--text-sm, 13px)',
        }}
      >
        Connecting to server…
      </p>
    </div>
  );
}

function BackendStartupGate({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    let cancelled = false;
    let resolved = false;

    const markReady = () => {
      if (cancelled || resolved) return;
      resolved = true;
      setIsReady(true);
    };

    const timeoutId = window.setTimeout(() => {
      console.warn('Health check timeout, continuing anyway');
      markBackendReadyFailOpen();
      markReady();
    }, 2000);

    const run = async () => {
      const configuredBase = (
        (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
        (import.meta.env.VITE_API_URL as string | undefined)?.trim()
      )?.replace(/\/$/, '');
      const healthPaths = configuredBase
        ? [`${configuredBase}/api/health`, `${configuredBase}/health`]
        : ['/api/health', '/health'];
      for (const path of healthPaths) {
        try {
          const response = await fetch(path, { method: 'GET' });
          if (response.ok) {
            markBackendReadyFromHealth();
            markReady();
            return;
          }
        } catch {
          // Try the next health path.
        }
      }
      markBackendReadyFailOpen();
      markReady();
    };

    void run();
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <>
      {!isReady && <OverlayLoader />}
      {children}
    </>
  );
}

function AuthSessionBootstrap() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setSessionLoading = useAuthStore((s) => s.setSessionLoading);

  useEffect(() => {
    if (!isHydrated) return;

    const releaseSessionGate = () => setSessionLoading(false);
    const key = sessionBootstrapKey(accessToken, refreshToken);

    if (!key) {
      sessionBootstrapCompletedFor = null;
      releaseSessionGate();
      return;
    }

    if (sessionBootstrapCompletedFor === key) {
      releaseSessionGate();
      return;
    }

    let cancelled = false;

    const runBootstrap = async () => {
      setSessionLoading(true);
      console.log('loading auth...');
      try {
        let bootstrapTimeoutId = 0;
        const me = await Promise.race([
          authApi.me().finally(() => {
            if (bootstrapTimeoutId) window.clearTimeout(bootstrapTimeoutId);
          }),
          new Promise<never>((_, reject) => {
            bootstrapTimeoutId = window.setTimeout(() => {
              reject(new ApiError(408, 'TIMEOUT', 'Session bootstrap timed out'));
            }, SESSION_BOOTSTRAP_TIMEOUT_MS);
          }),
        ]);

        if (cancelled) return;

        const currentUserBeforeNormalize = useAuthStore.getState().user;
        const normalized = normalizeMeUser(me, currentUserBeforeNormalize);

        if (!normalized) {
          const currentUser = useAuthStore.getState().user;
          if (!currentUser) {
            clearAuth();
            sessionBootstrapCompletedFor = null;
            return;
          }
          sessionBootstrapCompletedFor = key;
          return;
        }

        const currentUser = useAuthStore.getState().user;
        if (!currentUser) {
          setUser(normalized);
        }

        console.log('USER:', normalized);
        sessionBootstrapCompletedFor = key;
      } catch (error) {
        if (cancelled) return;

        if (error instanceof ApiError && error.statusCode === 401) {
          clearAuth();
          sessionBootstrapCompletedFor = null;
          return;
        }

        if (error instanceof ApiError && error.statusCode === 408) {
          if (!useAuthStore.getState().user) {
            clearAuth();
            sessionBootstrapCompletedFor = null;
            return;
          }
          sessionBootstrapCompletedFor = key;
          return;
        }

        sessionBootstrapCompletedFor = key;
      } finally {
        console.log('loading auth... done');
        releaseSessionGate();
      }
    };

    if (!sessionBootstrapInFlight) {
      sessionBootstrapInFlight = runBootstrap().finally(() => {
        sessionBootstrapInFlight = null;
      });
    } else {
      setSessionLoading(true);
      void sessionBootstrapInFlight.finally(() => {
        releaseSessionGate();
      });
    }

    return () => {
      cancelled = true;
    };
  }, [isHydrated, accessToken, refreshToken, setUser, clearAuth, setSessionLoading]);

  return null;
}

/** Drop cached API state when the session ends so stale data never renders after logout/401. */
/**
 * Ensures `isHydrated` flips true even if `onRehydrateStorage` never runs (storage/quirks),
 * so AuthGuard does not show the loading screen forever.
 */
function AuthPersistHydrationBridge() {
  useEffect(() => {
    const store = useAuthStore as unknown as {
      persist?: {
        hasHydrated?: () => boolean;
        onFinishHydration?: (fn: () => void) => () => void;
      };
    };
    const persist = store.persist;
    const mark = () => {
      if (!useAuthStore.getState().isHydrated) {
        useAuthStore.getState().setHydrated();
      }
      const { accessToken, refreshToken } = useAuthStore.getState();
      if (accessToken || refreshToken) {
        useAuthStore.getState().setSessionLoading(true);
      }
    };

    if (persist?.hasHydrated?.()) {
      mark();
      return undefined;
    }

    const unsub = persist?.onFinishHydration?.(mark);
    const tid = window.setTimeout(() => {
      if (!useAuthStore.getState().isHydrated) {
        console.warn(
          '[TFP auth] Persist did not finish in time; unlocking the shell. Sign in again if your session was lost.'
        );
        mark();
      }
    }, 4000);

    return () => {
      unsub?.();
      window.clearTimeout(tid);
    };
  }, []);

  return null;
}

function AuthQueryResetOnLogout() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let prevToken = useAuthStore.getState().accessToken;
    return useAuthStore.subscribe((state) => {
      if (prevToken && !state.accessToken) {
        void queryClient.clear();
      }
      prevToken = state.accessToken;
    });
  }, [queryClient]);

  return null;
}

function AuthLanguageBridge() {
  const userId = useAuthStore((s) => s.user?.userId ?? null);

  useEffect(() => {
    if (!userId) return;

    const accountLanguage = getUserLanguage(userId);
    if (accountLanguage) {
      if (getCurrentSupportedLanguage() !== accountLanguage) {
        void i18n.changeLanguage(accountLanguage);
      }
      return;
    }

    setUserLanguage(userId, getCurrentSupportedLanguage());
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const onLanguageChanged = (lang: string) => {
      const normalized = toSupportedLanguage(lang);
      if (!normalized) return;
      setUserLanguage(userId, normalized);
    };

    i18n.on('languageChanged', onLanguageChanged);
    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, [userId]);

  return null;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <BackendStartupGate>
        <AuthPersistHydrationBridge />
        <AuthQueryResetOnLogout />
        <AuthSessionBootstrap />
        <AuthLanguageBridge />
        {children}
      </BackendStartupGate>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
