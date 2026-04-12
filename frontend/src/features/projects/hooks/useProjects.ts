import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '@entities/project/project.api';
import type { CreateProjectPayload, UpdateProjectPayload } from '@entities/project/project.types';

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params: Record<string, unknown> = {}) => [...projectKeys.lists(), params] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
};

export function useProjects(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => projectApi.list(params),
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => projectApi.getById(projectId),
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => projectApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.lists() }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, payload }: { projectId: string; payload: UpdateProjectPayload }) =>
      projectApi.update(projectId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.lists() }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => projectApi.delete(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.lists() }),
  });
}
