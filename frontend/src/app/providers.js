import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider, useQueryClient, } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ApiError } from '@shared/api/client';
import { authApi } from '@entities/auth/auth.api';
import { useAuthStore } from '@app/store/auth.store';
import { toast } from '@app/store/toast.store';
import { normalizeMeUser } from '@shared/utils/normalize-me-user';
import { markBackendReadyFailOpen, markBackendReadyFromHealth, } from '@shared/api/backend-readiness';
/** Stable key for the current persisted session (access token preferred). */
function sessionBootstrapKey(accessToken, refreshToken) {
    if (!accessToken && !refreshToken)
        return null;
    if (accessToken)
        return `a:${accessToken}`;
    return `r:${refreshToken}`;
}
/** Which session key has finished bootstrap (success or terminal failure). */
let sessionBootstrapCompletedFor = null;
let sessionBootstrapInFlight = null;
const SESSION_BOOTSTRAP_TIMEOUT_MS = 25_000;
function toErrorMessage(error) {
    if (error instanceof ApiError)
        return error.message;
    if (error instanceof Error)
        return error.message;
    return 'Request failed. Please try again.';
}
function queryRetry(failureCount, error) {
    const status = error instanceof ApiError
        ? error.statusCode
        : error?.status;
    if (status === 401)
        return false;
    if (error instanceof ApiError && error.statusCode === 403)
        return false;
    return failureCount < 2;
}
const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error) => {
            if (error instanceof ApiError && error.statusCode === 401)
                return;
            toast.error('Request failed', toErrorMessage(error));
        },
    }),
    mutationCache: new MutationCache({
        onError: (error) => {
            if (error instanceof ApiError && error.statusCode === 401)
                return;
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
function OverlayLoader() {
    return (_jsx("div", { style: {
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            background: 'rgba(0,0,0,0.06)',
        }, children: _jsx("p", { style: {
                margin: 0,
                padding: '10px 14px',
                borderRadius: 'var(--radius-lg, 8px)',
                background: 'var(--color-bg, #fff)',
                border: '1px solid var(--color-border, #e5e5e5)',
                boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))',
                color: 'var(--color-text-secondary, #666)',
                fontSize: 'var(--text-sm, 13px)',
            }, children: "Connecting to server\u2026" }) }));
}
function BackendStartupGate({ children }) {
    const [isReady, setIsReady] = React.useState(false);
    useEffect(() => {
        let cancelled = false;
        let resolved = false;
        const markReady = () => {
            if (cancelled || resolved)
                return;
            resolved = true;
            setIsReady(true);
        };
        const timeoutId = window.setTimeout(() => {
            console.warn('Health check timeout, continuing anyway');
            markBackendReadyFailOpen();
            markReady();
        }, 2000);
        const run = async () => {
            const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '');
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
                }
                catch {
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
    return (_jsxs(_Fragment, { children: [!isReady && _jsx(OverlayLoader, {}), children] }));
}
function AuthSessionBootstrap() {
    const isHydrated = useAuthStore((s) => s.isHydrated);
    const accessToken = useAuthStore((s) => s.accessToken);
    const refreshToken = useAuthStore((s) => s.refreshToken);
    const setUser = useAuthStore((s) => s.setUser);
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const setSessionLoading = useAuthStore((s) => s.setSessionLoading);
    useEffect(() => {
        if (!isHydrated)
            return;
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
            try {
                let bootstrapTimeoutId = 0;
                const me = await Promise.race([
                    authApi.me().finally(() => {
                        if (bootstrapTimeoutId)
                            window.clearTimeout(bootstrapTimeoutId);
                    }),
                    new Promise((_, reject) => {
                        bootstrapTimeoutId = window.setTimeout(() => {
                            reject(new ApiError(408, 'TIMEOUT', 'Session bootstrap timed out'));
                        }, SESSION_BOOTSTRAP_TIMEOUT_MS);
                    }),
                ]);
                if (cancelled)
                    return;
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
                sessionBootstrapCompletedFor = key;
            }
            catch (error) {
                if (cancelled)
                    return;
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
            }
            finally {
                releaseSessionGate();
            }
        };
        if (!sessionBootstrapInFlight) {
            sessionBootstrapInFlight = runBootstrap().finally(() => {
                sessionBootstrapInFlight = null;
            });
        }
        else {
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
export function Providers({ children }) {
    return (_jsxs(QueryClientProvider, { client: queryClient, children: [_jsxs(BackendStartupGate, { children: [_jsx(AuthQueryResetOnLogout, {}), _jsx(AuthSessionBootstrap, {}), children] }), import.meta.env.DEV && _jsx(ReactQueryDevtools, { initialIsOpen: false })] }));
}
