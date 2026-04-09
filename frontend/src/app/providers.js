import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useRef } from 'react';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ApiError } from '@shared/api/client';
import { authApi } from '@entities/auth/auth.api';
import { useAuthStore } from '@app/store/auth.store';
import { toast } from '@app/store/toast.store';
import { normalizeMeUser } from '@shared/utils/normalize-me-user';
import { markBackendReadyFailOpen, markBackendReadyFromHealth, } from '@shared/api/backend-readiness';
let sessionBootstrapDone = false;
let sessionBootstrapPromise = null;
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
            const healthPaths = ['/api/health', '/health'];
            for (const path of healthPaths) {
                try {
                    const response = await fetch(path, { method: 'GET' });
                    console.log('Health check response', response.status, path);
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
    useEffect(() => {
        console.log('Backend gate ready:', isReady);
    }, [isReady]);
    return (_jsxs(_Fragment, { children: [!isReady && _jsx(OverlayLoader, {}), children] }));
}
function AuthSessionBootstrap() {
    const isHydrated = useAuthStore((s) => s.isHydrated);
    const accessToken = useAuthStore((s) => s.accessToken);
    const refreshToken = useAuthStore((s) => s.refreshToken);
    const setUser = useAuthStore((s) => s.setUser);
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const setSessionLoading = useAuthStore((s) => s.setSessionLoading);
    const bootstrappedRef = useRef(false);
    useEffect(() => {
        if (!isHydrated || bootstrappedRef.current)
            return;
        bootstrappedRef.current = true;
        if (sessionBootstrapDone) {
            setSessionLoading(false);
            return;
        }
        if (!accessToken && !refreshToken) {
            sessionBootstrapDone = true;
            setSessionLoading(false);
            return;
        }
        let cancelled = false;
        const runBootstrap = async () => {
            setSessionLoading(true);
            try {
                const me = await authApi.me();
                if (cancelled)
                    return;
                const currentUserBeforeNormalize = useAuthStore.getState().user;
                const normalized = normalizeMeUser(me, currentUserBeforeNormalize);
                if (!normalized) {
                    const currentUser = useAuthStore.getState().user;
                    if (!currentUser) {
                        clearAuth();
                    }
                    sessionBootstrapDone = true;
                    return;
                }
                console.log('BOOTSTRAP USER BEFORE', useAuthStore.getState().user);
                const currentUser = useAuthStore.getState().user;
                if (!currentUser) {
                    console.log('BOOTSTRAP SET USER', normalized);
                    setUser(normalized);
                }
                console.log('BOOTSTRAP USER AFTER', useAuthStore.getState().user);
                sessionBootstrapDone = true;
            }
            catch (error) {
                if (cancelled)
                    return;
                if (error instanceof ApiError && error.statusCode === 401) {
                    clearAuth();
                    sessionBootstrapDone = true;
                }
            }
            finally {
                if (!cancelled)
                    setSessionLoading(false);
            }
        };
        if (!sessionBootstrapPromise) {
            sessionBootstrapPromise = runBootstrap().finally(() => {
                sessionBootstrapPromise = null;
            });
        }
        else {
            setSessionLoading(true);
            void sessionBootstrapPromise.finally(() => {
                if (!cancelled)
                    setSessionLoading(false);
            });
        }
        return () => {
            cancelled = true;
        };
    }, [isHydrated, accessToken, refreshToken, setUser, clearAuth, setSessionLoading]);
    return null;
}
export function Providers({ children }) {
    const user = useAuthStore((s) => s.user);
    console.log('APP RENDER');
    console.log('USER STATE', user);
    return (_jsxs(QueryClientProvider, { client: queryClient, children: [_jsxs(BackendStartupGate, { children: [_jsx(AuthSessionBootstrap, {}), children] }), import.meta.env.DEV && _jsx(ReactQueryDevtools, { initialIsOpen: false })] }));
}
