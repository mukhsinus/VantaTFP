import { useQuery } from '@tanstack/react-query';
import { taskApi } from '@entities/task/task.api';
import { mapTaskListDtoToUiModels } from '@entities/task/task.mapper';
import type { ListTasksParams, TaskUiModel } from '@entities/task/task.types';
import { taskKeys } from './task.query-keys';

interface UseTasksResult {
  tasks: TaskUiModel[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseTasksOptions {
  enabled?: boolean;
}

export function useTasks(params: ListTasksParams = {}, options?: UseTasksOptions): UseTasksResult {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: taskKeys.list(params),
    queryFn:  () => taskApi.list(params),
    enabled: options?.enabled ?? true,
    select:   (response) => ({
      tasks: mapTaskListDtoToUiModels(response.data),
      total: response.total,
    }),
  });

  return {
    tasks:     data?.tasks ?? [],
    total:     data?.total ?? 0,
    isLoading,
    isError,
    error:     error as Error | null,
    refetch,
  };
}
