import { useAuthStore } from '@app/store/auth.store';
import { ApiError, apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
function resolveApiBaseUrl() {
    const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
    if (configuredBaseUrl)
        return configuredBaseUrl;
    return window.location.origin;
}
export const reportsApi = {
    generate: (payload) => apiClient.post(API.reports.generate, payload),
    history: (params) => apiClient.get(API.reports.history, params),
    export: async (payload) => {
        const token = useAuthStore.getState().accessToken;
        const response = await fetch(new URL(API.reports.export, resolveApiBaseUrl()).toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            if (response.status === 401) {
                useAuthStore.getState().clearAuth();
            }
            const body = await response.json().catch(() => null);
            throw new ApiError(response.status, body?.errorCode ?? 'REPORT_EXPORT_FAILED', body?.message ?? `Export failed (${response.status})`);
        }
        return response.blob();
    },
};
