import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
export const kpiApi = {
    list: () => apiClient.get(API.kpi.list),
    detail: (kpiId) => apiClient.get(API.kpi.detail(kpiId)),
    analyticsByEmployee: (params) => apiClient.get(API.kpi.analyticsByEmployee, params),
    analyticsAggregated: (params) => apiClient.get(API.kpi.analyticsAggregated, params),
};
