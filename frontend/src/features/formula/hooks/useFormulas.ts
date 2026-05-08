/**
 * Formulas API Hook
 * Manages formula CRUD operations and queries
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import type { FormulaType } from '@features/formula';

export interface Formula {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  formulaType: FormulaType;
  createdBy?: string;
  appliedTo: 'tenant' | 'employee';
  ast: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

const formulasQueryKey = () => ['formulas'];
const formulaTypeKey = (type: FormulaType) => [...formulasQueryKey(), 'type', type];
const formulaDetailKey = (id: string) => [...formulasQueryKey(), id];

export function useFormulas(formulaType?: FormulaType) {
  return useQuery<Formula[]>({
    queryKey: formulaType ? formulaTypeKey(formulaType) : formulasQueryKey(),
    queryFn: async () => {
      const params = formulaType ? `?type=${formulaType}` : '';
      const res = await apiClient.get(`/api/v1/formulas${params}`);
      return res.data;
    },
  });
}

export function useFormulaById(id: string | null) {
  return useQuery<Formula>({
    queryKey: id ? formulaDetailKey(id) : [],
    queryFn: async () => {
      if (!id) throw new Error('Formula ID is required');
      const res = await apiClient.get(`/api/v1/formulas/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateFormula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      formulaType: FormulaType;
      ast: Record<string, any>;
    }) => {
      const res = await apiClient.post('/api/v1/formulas', input);
      return res.data as Formula;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formulasQueryKey() });
    },
  });
}

export function useUpdateFormula(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name?: string;
      description?: string;
      formulaType?: FormulaType;
      ast?: Record<string, any>;
    }) => {
      const res = await apiClient.put(`/api/v1/formulas/${id}`, input);
      return res.data as Formula;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formulaDetailKey(id) });
      queryClient.invalidateQueries({ queryKey: formulasQueryKey() });
    },
  });
}

export function useDeleteFormula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/api/v1/formulas/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formulasQueryKey() });
    },
  });
}

export function useEvaluateFormula(id: string) {
  return useMutation({
    mutationFn: async (context: Record<string, number>) => {
      const res = await apiClient.post(`/api/v1/formulas/${id}/evaluate`, { context });
      return res.data;
    },
  });
}
