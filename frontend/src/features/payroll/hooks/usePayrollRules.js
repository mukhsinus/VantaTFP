import { useQuery } from '@tanstack/react-query';
import { payrollApi } from '@entities/payroll/payroll.api';
import { payrollKeys } from './payroll.query-keys';
export function usePayrollRules() {
    return useQuery({
        queryKey: [...payrollKeys.all, 'rules'],
        queryFn: payrollApi.listRules,
    });
}
