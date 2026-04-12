import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type { LabelApiDto, CreateLabelPayload, UpdateLabelPayload } from './label.types';

export const labelApi = {
  list: (): Promise<LabelApiDto[]> =>
    apiClient.get<LabelApiDto[]>(API.labels.list),

  create: (payload: CreateLabelPayload): Promise<LabelApiDto> =>
    apiClient.post<LabelApiDto>(API.labels.list, payload),

  update: (labelId: string, payload: UpdateLabelPayload): Promise<LabelApiDto> =>
    apiClient.patch<LabelApiDto>(API.labels.detail(labelId), payload),

  delete: (labelId: string): Promise<void> =>
    apiClient.delete(API.labels.detail(labelId)) as Promise<void>,

  getTaskLabels: (taskId: string): Promise<LabelApiDto[]> =>
    apiClient.get<LabelApiDto[]>(API.labels.taskLabels(taskId)),

  setTaskLabels: (taskId: string, labelIds: string[]): Promise<LabelApiDto[]> =>
    apiClient.put<LabelApiDto[]>(API.labels.taskLabels(taskId), { labelIds }),
};
