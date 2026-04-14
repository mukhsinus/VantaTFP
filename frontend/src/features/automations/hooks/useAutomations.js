import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationApi } from '@entities/automation/automation.api';
export const automationKeys = {
    all: ['automations'],
    lists: () => [...automationKeys.all, 'list'],
    list: (params = {}) => [...automationKeys.lists(), params],
    detail: (id) => [...automationKeys.all, 'detail', id],
};
export function useAutomations(params = {}) {
    return useQuery({
        queryKey: automationKeys.list(params),
        queryFn: () => automationApi.list(params),
    });
}
export function useCreateAutomation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => automationApi.create(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: automationKeys.lists() }),
    });
}
export function useUpdateAutomation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ ruleId, payload }) => automationApi.update(ruleId, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: automationKeys.lists() }),
    });
}
export function useDeleteAutomation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (ruleId) => automationApi.delete(ruleId),
        onSuccess: () => qc.invalidateQueries({ queryKey: automationKeys.lists() }),
    });
}
