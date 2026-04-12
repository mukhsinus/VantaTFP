import { useQuery } from '@tanstack/react-query';
import { payrollApi } from '@entities/payroll/payroll.api';
import { payrollKeys } from './payroll.query-keys';
export function usePayroll(options) {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: payrollKeys.list(),
        queryFn: payrollApi.list,
        enabled: options?.enabled ?? true,
        select: (response) => response.data ?? [],
    });
    return {
        payroll: data ?? [],
        isLoading,
        isError,
        error: error,
    };
}
