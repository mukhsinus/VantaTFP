import { useQuery } from '@tanstack/react-query';
import { payrollApi } from '@entities/payroll/payroll.api';
import type { PayrollApiDto } from '@entities/payroll/payroll.types';
import { payrollKeys } from './payroll.query-keys';

interface UsePayrollResult {
  payroll: PayrollApiDto[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function usePayroll(): UsePayrollResult {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: payrollKeys.list(),
    queryFn: payrollApi.list,
    select: (response) => response.data ?? [],
  });

  return {
    payroll: data ?? [],
    isLoading,
    isError,
    error: error as Error | null,
  };
}
