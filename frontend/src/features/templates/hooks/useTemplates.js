import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateApi } from '@entities/template/template.api';
export const templateKeys = {
    all: ['templates'],
    list: () => [...templateKeys.all, 'list'],
    detail: (id) => [...templateKeys.all, 'detail', id],
};
export function useTemplates() {
    return useQuery({
        queryKey: templateKeys.list(),
        queryFn: () => templateApi.list(),
    });
}
export function useCreateTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => templateApi.create(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.list() }),
    });
}
export function useUpdateTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ templateId, payload }) => templateApi.update(templateId, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.list() }),
    });
}
export function useDeleteTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (templateId) => templateApi.delete(templateId),
        onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.list() }),
    });
}
