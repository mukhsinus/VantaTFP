import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';

export const useObject = (objectId: string) => {
  return useQuery({
    queryKey: ['objects', objectId],
    queryFn: async () => {
      const res = await apiClient.get(`/objects/${objectId}`);
      return res.data;
    },
    staleTime: 30000,
  });
};

export const useObjects = (
  params: {
    page?: number;
    limit?: number;
    object_type?: string;
    search?: string;
  } = {}
) => {
  return useQuery({
    queryKey: ['objects', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: String(params.page || 1),
        limit: String(params.limit || 20),
        ...(params.object_type && { object_type: params.object_type }),
        ...(params.search && { search: params.search }),
      });
      const res = await apiClient.get(`/objects?${searchParams}`);
      return res.data;
    },
    staleTime: 30000,
  });
};

export const useCreateObject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/objects', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objects'] });
    },
  });
};

export const useUpdateObject = (objectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.patch(`/objects/${objectId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objects', objectId] });
      queryClient.invalidateQueries({ queryKey: ['objects'] });
    },
  });
};

export const useDeleteObject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (objectId: string) => {
      await apiClient.delete(`/objects/${objectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objects'] });
    },
  });
};

export const useObjectTasks = (
  params: {
    page?: number;
    limit?: number;
    object_id?: string;
    status?: string;
    priority?: string;
  } = {}
) => {
  return useQuery({
    queryKey: ['object-tasks', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: String(params.page || 1),
        limit: String(params.limit || 20),
        ...(params.object_id && { object_id: params.object_id }),
        ...(params.status && { status: params.status }),
        ...(params.priority && { priority: params.priority }),
      });
      const res = await apiClient.get(`/objects/tasks?${searchParams}`);
      return res.data;
    },
    staleTime: 30000,
  });
};

export const useObjectTask = (taskId: string) => {
  return useQuery({
    queryKey: ['object-task', taskId],
    queryFn: async () => {
      const res = await apiClient.get(`/objects/tasks/${taskId}`);
      return res.data;
    },
    staleTime: 30000,
  });
};

export const useCreateObjectTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/objects/tasks', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['object-tasks'] });
      queryClient.setQueryData(['object-task', data.id], data);
    },
  });
};

export const useUpdateObjectTask = (taskId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.patch(`/objects/tasks/${taskId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['object-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['object-task', taskId] });
    },
  });
};

export const useDeleteObjectTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      await apiClient.delete(`/objects/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['object-tasks'] });
    },
  });
};

export const useStartObjectTask = (taskId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/objects/tasks/${taskId}/start`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['object-task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['object-tasks'] });
    },
  });
};

export const useCompleteObjectTask = (taskId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notes?: string) => {
      const res = await apiClient.post(`/objects/tasks/${taskId}/complete`, { notes });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['object-task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['object-tasks'] });
    },
  });
};
