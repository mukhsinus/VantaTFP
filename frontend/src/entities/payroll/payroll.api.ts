import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type { PayrollApiDto, PayrollListApiDto } from './payroll.types';

export const payrollApi = {
  list: (): Promise<PayrollListApiDto> =>
    apiClient.get<PayrollListApiDto>(API.payroll.list),

  detail: (payrollId: string): Promise<PayrollApiDto> =>
    apiClient.get<PayrollApiDto>(API.payroll.detail(payrollId)),

  approve: (payrollId: string): Promise<PayrollApiDto> =>
    apiClient.post<PayrollApiDto>(API.payroll.approve(payrollId)),
};
