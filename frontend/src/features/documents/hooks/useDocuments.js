import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '@entities/document/document.api';
export const documentKeys = {
    all: ['documents'],
    lists: () => [...documentKeys.all, 'list'],
    list: (params = {}) => [...documentKeys.lists(), params],
    detail: (id) => [...documentKeys.all, 'detail', id],
};
export function useDocuments(params = {}) {
    return useQuery({
        queryKey: documentKeys.list(params),
        queryFn: () => documentApi.list(params),
    });
}
export function useDocument(docId) {
    return useQuery({
        queryKey: documentKeys.detail(docId),
        queryFn: () => documentApi.getById(docId),
        enabled: !!docId,
    });
}
export function useCreateDocument() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => documentApi.create(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.lists() }),
    });
}
export function useUpdateDocument() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ docId, payload }) => documentApi.update(docId, payload),
        onSuccess: (_, { docId }) => {
            qc.invalidateQueries({ queryKey: documentKeys.lists() });
            qc.invalidateQueries({ queryKey: documentKeys.detail(docId) });
        },
    });
}
export function useDeleteDocument() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (docId) => documentApi.delete(docId),
        onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.lists() }),
    });
}
