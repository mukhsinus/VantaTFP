import { useAuthStore } from '@app/store/auth.store';
import i18n from '@shared/i18n/i18n';
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
    get isUnauthorized() { return this.statusCode === 401; }
    get isForbidden() { return this.statusCode === 403; }
    get isNotFound() { return this.statusCode === 404; }
    get isConflict() { return this.statusCode === 409; }
    get isValidation() { return this.statusCode === 422; }
}
function resolveApiBaseUrl() {
    const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
    if (configuredBaseUrl) {
        return configuredBaseUrl;
    }
    // Local development: Vite proxy handles /api -> backend
    if (import.meta.env.DEV) {
        return window.location.origin;
    }
    // Production without explicit API base URL usually means deployment misconfiguration.
    // Throw a typed error so UI can show a clear message.
    throw new ApiError(503, 'API_NOT_CONFIGURED', i18n.t('errors.generic.apiNotConfigured'));
}
// ─── Core request function ────────────────────────────────────────────────────
async function request(path, options = {}) {
    const { params, body, headers: extraHeaders, ...init } = options;
    // Build URL with query params
    const baseUrl = resolveApiBaseUrl();
    const url = new URL(path, baseUrl);
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
    const response = await fetch(url.toString(), {
        ...init,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    // Global 401 handler — clear auth so the router can redirect to login
    if (response.status === 401) {
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
        throw new ApiError(response.status, errorBody?.errorCode ?? 'UNKNOWN_ERROR', errorBody?.message ?? i18n.t('errors.generic.requestFailed', { statusCode: response.status }));
    }
    return data;
}
// ─── Public API client ────────────────────────────────────────────────────────
export const apiClient = {
    get: (path, params) => request(path, { method: 'GET', params }),
    post: (path, body) => request(path, { method: 'POST', body }),
    patch: (path, body) => request(path, { method: 'PATCH', body }),
    put: (path, body) => request(path, { method: 'PUT', body }),
    delete: (path) => request(path, { method: 'DELETE' }),
};
