import { useAuthStore } from '@app/store/auth.store';
import i18n from '@shared/i18n/i18n';
import { normalizeMeUser } from '@shared/utils/normalize-me-user';
import { waitUntilBackendReady } from '@shared/api/backend-readiness';
// ─── Error type ───────────────────────────────────────────────────────────────
export class ApiError extends Error {
    statusCode;
    errorCode;
    constructor(statusCode, errorCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.name = 'ApiError';
    }
    /** Alias for React Query / logging (`error?.status`). */
    get status() {
        return this.statusCode;
    }
    get isUnauthorized() { return this.statusCode === 401; }
    get isForbidden() { return this.statusCode === 403; }
    get isNotFound() { return this.statusCode === 404; }
    get isConflict() { return this.statusCode === 409; }
    get isValidation() { return this.statusCode === 422; }
}
const MAX_REQUEST_RETRIES = 3;
const pendingGetRequests = new Map();
const APP_BOOT_TIME_MS = Date.now();
/** Browser-relative API prefix; Vite dev server proxies `/api` → backend (see vite.config.ts). */
export const API_BASE = '/api';
function resolveApiBaseUrl() {
    const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
    const directApi = import.meta.env.VITE_DIRECT_API === 'true' || import.meta.env.VITE_DIRECT_API === '1';
    if (import.meta.env.DEV && !directApi) {
        return window.location.origin;
    }
    if (configuredBaseUrl) {
        return configuredBaseUrl;
    }
    if (import.meta.env.DEV) {
        return window.location.origin;
    }
    throw new ApiError(503, 'API_NOT_CONFIGURED', i18n.t('errors.generic.apiNotConfigured'));
}
async function fetchWithRetry(url, init) {
    let attempt = 0;
    let lastError = null;
    while (attempt < MAX_REQUEST_RETRIES) {
        try {
            return await fetch(url, init);
        }
        catch (error) {
            lastError = error;
            attempt += 1;
            if (attempt >= MAX_REQUEST_RETRIES)
                break;
            const delayMs = 200 * 2 ** (attempt - 1);
            if (import.meta.env.DEV && Date.now() - APP_BOOT_TIME_MS > 2000) {
                console.warn('[api-client] backend unavailable, retrying request', {
                    attempt,
                    nextDelayMs: delayMs,
                    url,
                });
            }
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    throw new ApiError(503, 'BACKEND_UNAVAILABLE', lastError instanceof Error ? lastError.message : i18n.t('errors.generic.requestFailed', { statusCode: 503 }));
}
// ─── Core request function ────────────────────────────────────────────────────
async function request(path, options = {}) {
    await waitUntilBackendReady();
    const { params, body, headers: extraHeaders, retryOnUnauthorized = true, ...init } = options;
    // Build URL with query params
    const baseUrl = resolveApiBaseUrl();
    const url = new URL(path, baseUrl);
    console.log('API REQUEST', url.toString());
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, String(value));
            }
        });
    }
    // Inject JWT from Zustand store without requiring a React hook
    const accessToken = useAuthStore.getState().accessToken;
    const headers = {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(extraHeaders ?? {}),
    };
    const requestKey = `${init.method ?? 'GET'}:${url.toString()}:${useAuthStore.getState().accessToken ?? ''}`;
    const run = async () => {
        const response = await fetchWithRetry(url.toString(), {
            ...init,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        // Global 401 handler — clear auth so the router can redirect to login
        if (response.status === 401) {
            const refreshed = retryOnUnauthorized
                ? await tryRefreshToken()
                : false;
            if (refreshed) {
                return request(path, { ...options, retryOnUnauthorized: false });
            }
            useAuthStore.getState().clearAuth();
            throw new ApiError(401, 'UNAUTHORIZED', i18n.t('auth.session.expired'));
        }
        // No-content responses
        if (response.status === 204) {
            return undefined;
        }
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            const errorBody = data;
            throw new ApiError(response.status, errorBody?.errorCode ?? errorBody?.error?.code ?? 'UNKNOWN_ERROR', errorBody?.message ?? errorBody?.error?.message ?? i18n.t('errors.generic.requestFailed', { statusCode: response.status }));
        }
        if (data &&
            typeof data === 'object' &&
            'data' in data &&
            'error' in data) {
            return data.data;
        }
        return data;
    };
    if ((init.method ?? 'GET') === 'GET') {
        const existing = pendingGetRequests.get(requestKey);
        if (existing)
            return existing;
        const promise = run().finally(() => {
            pendingGetRequests.delete(requestKey);
        });
        pendingGetRequests.set(requestKey, promise);
        return promise;
    }
    return run();
}
let refreshInFlight = null;
async function tryRefreshToken() {
    if (refreshInFlight)
        return refreshInFlight;
    refreshInFlight = (async () => {
        const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();
        if (!refreshToken)
            return false;
        try {
            const baseUrl = resolveApiBaseUrl();
            const url = new URL('/api/v1/auth/refresh', baseUrl);
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });
            if (!response.ok) {
                clearAuth();
                return false;
            }
            const raw = (await response.json().catch(() => null));
            const payload = raw && typeof raw === 'object' && 'data' in raw
                ? raw.data
                : raw;
            const nextAccessToken = payload?.accessToken;
            const nextRefreshToken = payload?.refreshToken ?? refreshToken;
            if (!nextAccessToken) {
                clearAuth();
                return false;
            }
            setTokens(nextAccessToken, nextRefreshToken);
            try {
                const mePayload = await request('/api/v1/users/me', {
                    method: 'GET',
                    retryOnUnauthorized: false,
                });
                const normalized = normalizeMeUser(mePayload, useAuthStore.getState().user);
                if (normalized) {
                    useAuthStore.getState().setUser(normalized);
                    console.log('CLIENT SET USER', normalized);
                }
            }
            catch {
                // Tokens are valid; session bootstrap or the retried call can still load profile.
            }
            return true;
        }
        catch {
            clearAuth();
            return false;
        }
    })();
    try {
        return await refreshInFlight;
    }
    finally {
        refreshInFlight = null;
    }
}
// ─── Public API client ────────────────────────────────────────────────────────
export const apiClient = {
    get: (path, params) => request(path, { method: 'GET', params }),
    post: (path, body) => request(path, { method: 'POST', body }),
    patch: (path, body) => request(path, { method: 'PATCH', body }),
    put: (path, body) => request(path, { method: 'PUT', body }),
    delete: (path) => request(path, { method: 'DELETE' }),
};
