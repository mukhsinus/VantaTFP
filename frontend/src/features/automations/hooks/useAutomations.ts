import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationApi } from '@entities/automation/automation.api';
import type { CreateAutomationPayload, UpdateAutomationPayload } from '@entities/automation/automation.types';

export const automationKeys = {
  all: ['automations'] as const,
  lists: () => [...automationKeys.all, 'list'] as const,
  list: (params: Record<string, unknown> = {}) => [...automationKeys.lists(), params] as const,
  detail: (id: string) => [...automationKeys.all, 'detail', id] as const,
};

export function useAutomations(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: automationKeys.list(params),
    queryFn: () => automationApi.list(params),
  });
}

export function useCreateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAutomationPayload) => automationApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: automationKeys.lists() }),
  });
}

export function useUpdateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, payload }: { ruleId: string; payload: UpdateAutomationPayload }) =>
      automationApi.update(ruleId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: automationKeys.lists() }),
  });
}

export function useDeleteAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => automationApi.delete(ruleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: automationKeys.lists() }),
  });
}
