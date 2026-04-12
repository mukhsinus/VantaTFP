import { useQuery } from '@tanstack/react-query';
import { kpiApi } from '@entities/kpi/kpi.api';
import { kpiKeys } from './kpi.query-keys';
export function useKpis(options) {
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
        error: error,
    };
}
