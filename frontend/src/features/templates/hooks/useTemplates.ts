import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateApi } from '@entities/template/template.api';
import type { CreateTemplatePayload, UpdateTemplatePayload } from '@entities/template/template.types';

export const templateKeys = {
  all: ['templates'] as const,
  list: () => [...templateKeys.all, 'list'] as const,
  detail: (id: string) => [...templateKeys.all, 'detail', id] as const,
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
    mutationFn: (payload: CreateTemplatePayload) => templateApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.list() }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload: UpdateTemplatePayload }) =>
      templateApi.update(templateId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.list() }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => templateApi.delete(templateId),
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.list() }),
  });
}
