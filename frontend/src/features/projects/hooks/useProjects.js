import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '@entities/project/project.api';
export const projectKeys = {
    all: ['projects'],
    lists: () => [...projectKeys.all, 'list'],
    list: (params = {}) => [...projectKeys.lists(), params],
    detail: (id) => [...projectKeys.all, 'detail', id],
};
export function useProjects(params = {}) {
    return useQuery({
        queryKey: projectKeys.list(params),
        queryFn: () => projectApi.list(params),
    });
}
export function useProject(projectId) {
    return useQuery({
        queryKey: projectKeys.detail(projectId),
        queryFn: () => projectApi.getById(projectId),
        enabled: !!projectId,
    });
}
export function useCreateProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => projectApi.create(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.lists() }),
    });
}
export function useUpdateProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, payload }) => projectApi.update(projectId, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.lists() }),
    });
}
export function useDeleteProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (projectId) => projectApi.delete(projectId),
        onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.lists() }),
    });
}
