import { useAuthStore } from '@app/store/auth.store';

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
}

// ─── Request options ──────────────────────────────────────────────────────────

interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
}

// ─── Core request function ────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, body, headers: extraHeaders, ...init } = options;

  // Build URL with query params
  const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
  const url = new URL(path, baseUrl || window.location.origin);

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

  const response = await fetch(url.toString(), {
    ...init,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Global 401 handler — clear auth so the router can redirect to login
  if (response.status === 401) {
    useAuthStore.getState().clearAuth();
    throw new ApiError(401, 'UNAUTHORIZED', 'Session expired. Please sign in again.');
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
      errorBody?.errorCode ?? 'UNKNOWN_ERROR',
      errorBody?.message ?? `Request failed with status ${response.status}`
    );
  }

  return data as T;
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
