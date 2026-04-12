import { useQuery } from '@tanstack/react-query';
import { kpiApi } from '@entities/kpi/kpi.api';
import type { KpiApiDto } from '@entities/kpi/kpi.types';
import { kpiKeys } from './kpi.query-keys';

interface UseKpisResult {
  kpis: KpiApiDto[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useKpis(options?: { enabled?: boolean }): UseKpisResult {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: kpiKeys.list(),
    queryFn: kpiApi.list,
    enabled: options?.enabled ?? true,
    select: (response) => response.data ?? [],
  });

  return {
    kpis: data ?? [],
    isLoading,
    isError,
    error: error as Error | null,
  };
}
