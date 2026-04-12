import { useAuthStore } from '@app/store/auth.store';
import { ApiError, apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type {
  GenerateReportResponseDto,
  ReportFilters,
  ReportFormat,
  ReportHistoryListDto,
  ReportType,
} from './reports.types';

function resolveApiBaseUrl(): string {
  const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (configuredBaseUrl) return configuredBaseUrl;
  return window.location.origin;
}

export const reportsApi = {
  generate: (payload: { type: ReportType } & ReportFilters): Promise<GenerateReportResponseDto> =>
    apiClient.post<GenerateReportResponseDto>(API.reports.generate, payload),

  history: (params?: { type?: ReportType; page?: number; limit?: number }): Promise<ReportHistoryListDto> =>
    apiClient.get<ReportHistoryListDto>(API.reports.history, params),

  export: async (payload: { type: ReportType; format: ReportFormat } & ReportFilters): Promise<Blob> => {
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
      const body = await response.json().catch(() => null) as { message?: string; errorCode?: string } | null;
      throw new ApiError(
        response.status,
        body?.errorCode ?? 'REPORT_EXPORT_FAILED',
        body?.message ?? `Export failed (${response.status})`
      );
    }

    return response.blob();
  },
};
