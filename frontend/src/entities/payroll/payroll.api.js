import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
export const payrollApi = {
    list: () => apiClient.get(API.payroll.list),
    detail: (payrollId) => apiClient.get(API.payroll.detail(payrollId)),
    approve: (payrollId) => apiClient.post(API.payroll.approve(payrollId)),
    listRules: () => apiClient.get(API.payroll.rules),
    applyRule: (ruleId, payload) => apiClient.post(API.payroll.applyRule(ruleId), payload),
};
