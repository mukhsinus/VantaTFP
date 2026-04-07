import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type { KpiApiDto, KpiListApiDto } from './kpi.types';

export const kpiApi = {
  list: (): Promise<KpiListApiDto> =>
    apiClient.get<KpiListApiDto>(API.kpi.list),

  detail: (kpiId: string): Promise<KpiApiDto> =>
    apiClient.get<KpiApiDto>(API.kpi.detail(kpiId)),
};
