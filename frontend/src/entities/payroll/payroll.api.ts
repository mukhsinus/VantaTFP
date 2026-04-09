import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type {
  PayrollApiDto,
  PayrollListApiDto,
  PayrollRuleDto,
  ApplyPayrollRuleResponseDto,
} from './payroll.types';

export const payrollApi = {
  list: (): Promise<PayrollListApiDto> =>
    apiClient.get<PayrollListApiDto>(API.payroll.list),

  detail: (payrollId: string): Promise<PayrollApiDto> =>
    apiClient.get<PayrollApiDto>(API.payroll.detail(payrollId)),

  approve: (payrollId: string): Promise<PayrollApiDto> =>
    apiClient.post<PayrollApiDto>(API.payroll.approve(payrollId)),

  listRules: (): Promise<PayrollRuleDto[]> =>
    apiClient.get<PayrollRuleDto[]>(API.payroll.rules),

  applyRule: (
    ruleId: string,
    payload: { userId: string; periodStart: string; periodEnd: string }
  ): Promise<ApplyPayrollRuleResponseDto> =>
    apiClient.post<ApplyPayrollRuleResponseDto>(API.payroll.applyRule(ruleId), payload),
};
