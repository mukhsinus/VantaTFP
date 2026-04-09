import { useAuthStore } from '@app/store/auth.store';
import i18n from '@shared/i18n/i18n';
import { normalizeMeUser } from '@shared/utils/normalize-me-user';
import { waitUntilBackendReady } from '@shared/api/backend-readiness';

// ─── Error type ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Alias for React Query / logging (`error?.status`). */
  get status(): number {
    return this.statusCode;
  }

  get isUnauthorized() { return this.statusCode === 401; }
  get isForbidden()    { return this.statusCode === 403; }
  get isNotFound()     { return this.statusCode === 404; }
  get isConflict()     { return this.statusCode === 409; }
  get isValidation()   { return this.statusCode === 422; }
}

// ─── Internal error response shape from Fastify backend ──────────────────────

interface ApiErrorBody {
  statusCode: number;
  errorCode: string;
  message: string;
  error?: {
    code?: string;
    message?: string;
  };
}

// ─── Request options ──────────────────────────────────────────────────────────

interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  retryOnUnauthorized?: boolean;
}

interface ApiEnvelope<T> {
  data: T | null;
  error: { code?: string; message?: string } | null;
}

const MAX_REQUEST_RETRIES = 3;
const pendingGetRequests = new Map<string, Promise<unknown>>();
const APP_BOOT_TIME_MS = Date.now();

/** Browser-relative API prefix; Vite dev server proxies `/api` → backend (see vite.config.ts). */
export const API_BASE = '/api';

function resolveApiBaseUrl(): string {
  const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  // Local development: same origin; request paths must start with API_BASE (e.g. /api/v1/...).
  if (import.meta.env.DEV) {
    return window.location.origin;
  }

  // Production without explicit API base URL usually means deployment misconfiguration.
  // Throw a typed error so UI can show a clear message.
  throw new ApiError(
    503,
    'API_NOT_CONFIGURED',
    i18n.t('errors.generic.apiNotConfigured')
  );
}

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < MAX_REQUEST_RETRIES) {
    try {
      return await fetch(url, init);
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt >= MAX_REQUEST_RETRIES) break;
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

  throw new ApiError(
    503,
    'BACKEND_UNAVAILABLE',
    lastError instanceof Error ? lastError.message : i18n.t('errors.generic.requestFailed', { statusCode: 503 })
  );
}

// ─── Core request function ────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  await waitUntilBackendReady();

  const {
    params,
    body,
    headers: extraHeaders,
    retryOnUnauthorized = true,
    ...init
  } = options;

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

  const headers: HeadersInit = {
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
        return request<T>(path, { ...options, retryOnUnauthorized: false });
      }

      useAuthStore.getState().clearAuth();
      throw new ApiError(401, 'UNAUTHORIZED', i18n.t('auth.session.expired'));
    }

    // No-content responses
    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorBody = data as ApiErrorBody | null;
      throw new ApiError(
        response.status,
        errorBody?.errorCode ?? errorBody?.error?.code ?? 'UNKNOWN_ERROR',
        errorBody?.message ?? errorBody?.error?.message ?? i18n.t('errors.generic.requestFailed', { statusCode: response.status })
      );
    }

    if (
      data &&
      typeof data === 'object' &&
      'data' in (data as Record<string, unknown>) &&
      'error' in (data as Record<string, unknown>)
    ) {
      return (data as ApiEnvelope<T>).data as T;
    }

    return data as T;
  };

  if ((init.method ?? 'GET') === 'GET') {
    const existing = pendingGetRequests.get(requestKey) as Promise<T> | undefined;
    if (existing) return existing;
    const promise = run().finally(() => {
      pendingGetRequests.delete(requestKey);
    });
    pendingGetRequests.set(requestKey, promise);
    return promise;
  }

  return run();
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();
    if (!refreshToken) return false;

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

      const raw = (await response.json().catch(() => null)) as
        | ApiEnvelope<{ accessToken?: string; refreshToken?: string }>
        | { accessToken?: string; refreshToken?: string }
        | null;

      const payload =
        raw && typeof raw === 'object' && 'data' in raw
          ? (raw as ApiEnvelope<{ accessToken?: string; refreshToken?: string }>).data
          : (raw as { accessToken?: string; refreshToken?: string } | null);

      const nextAccessToken = payload?.accessToken;
      const nextRefreshToken = payload?.refreshToken ?? refreshToken;

      if (!nextAccessToken) {
        clearAuth();
        return false;
      }

      setTokens(nextAccessToken, nextRefreshToken);

      try {
        const mePayload = await request<unknown>('/api/v1/users/me', {
          method: 'GET',
          retryOnUnauthorized: false,
        });
        const normalized = normalizeMeUser(mePayload, useAuthStore.getState().user);
        if (normalized) {
          useAuthStore.getState().setUser(normalized);
          console.log('CLIENT SET USER', normalized);
        }
      } catch {
        // Tokens are valid; session bootstrap or the retried call can still load profile.
      }

      return true;
    } catch {
      clearAuth();
      return false;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

// ─── Public API client ────────────────────────────────────────────────────────

export const apiClient = {
  get: <T>(path: string, params?: RequestOptions['params']) =>
    request<T>(path, { method: 'GET', params }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body }),

  delete: <T = void>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};
