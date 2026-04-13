import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '@entities/document/document.api';
import type { CreateDocumentPayload, UpdateDocumentPayload } from '@entities/document/document.types';

type ApiParams = Record<string, string | number | boolean | null | undefined>;

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (params: ApiParams = {}) => [...documentKeys.lists(), params] as const,
  detail: (id: string) => [...documentKeys.all, 'detail', id] as const,
};

export function useDocuments(params: ApiParams = {}) {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => documentApi.list(params),
  });
}

export function useDocument(docId: string) {
  return useQuery({
    queryKey: documentKeys.detail(docId),
    queryFn: () => documentApi.getById(docId),
    enabled: !!docId,
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDocumentPayload) => documentApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.lists() }),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ docId, payload }: { docId: string; payload: UpdateDocumentPayload }) =>
      documentApi.update(docId, payload),
    onSuccess: (_, { docId }) => {
      qc.invalidateQueries({ queryKey: documentKeys.lists() });
      qc.invalidateQueries({ queryKey: documentKeys.detail(docId) });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => documentApi.delete(docId),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.lists() }),
  });
}
