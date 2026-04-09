import { useQuery } from '@tanstack/react-query';
import { taskApi } from '@entities/task/task.api';
import { mapTaskListDtoToUiModels } from '@entities/task/task.mapper';
import { taskKeys } from './task.query-keys';
export function useTasks(params = {}, options) {
    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: taskKeys.list(params),
        queryFn: () => taskApi.list(params),
        enabled: options?.enabled ?? true,
        select: (response) => ({
            tasks: mapTaskListDtoToUiModels(response.data),
            total: response.total,
        }),
    });
    return {
        tasks: data?.tasks ?? [],
        total: data?.total ?? 0,
        isLoading,
        isError,
        error: error,
        refetch,
    };
}
