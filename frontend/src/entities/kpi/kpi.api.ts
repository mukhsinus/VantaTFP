import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type {
  KpiApiDto,
  KpiListApiDto,
  KpiAnalyticsByEmployeeDto,
  KpiAnalyticsAggregatedDto,
} from './kpi.types';

export const kpiApi = {
  list: (): Promise<KpiListApiDto> =>
    apiClient.get<KpiListApiDto>(API.kpi.list),

  detail: (kpiId: string): Promise<KpiApiDto> =>
    apiClient.get<KpiApiDto>(API.kpi.detail(kpiId)),

  analyticsByEmployee: (params: {
    periodStart: string;
    periodEnd: string;
    userId?: string;
    teamId?: string;
    refresh?: boolean;
  }): Promise<KpiAnalyticsByEmployeeDto> =>
    apiClient.get<KpiAnalyticsByEmployeeDto>(API.kpi.analyticsByEmployee, params),

  analyticsAggregated: (params: {
    periodStart: string;
    periodEnd: string;
    userId?: string;
    teamId?: string;
    refresh?: boolean;
  }): Promise<KpiAnalyticsAggregatedDto> =>
    apiClient.get<KpiAnalyticsAggregatedDto>(API.kpi.analyticsAggregated, params),
};
