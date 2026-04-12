import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type { TemplateApiDto, CreateTemplatePayload, UpdateTemplatePayload } from './template.types';

export const templateApi = {
  list: (): Promise<TemplateApiDto[]> =>
    apiClient.get<TemplateApiDto[]>(API.templates.list),

  getById: (templateId: string): Promise<TemplateApiDto> =>
    apiClient.get<TemplateApiDto>(API.templates.detail(templateId)),

  create: (payload: CreateTemplatePayload): Promise<TemplateApiDto> =>
    apiClient.post<TemplateApiDto>(API.templates.list, payload),

  update: (templateId: string, payload: UpdateTemplatePayload): Promise<TemplateApiDto> =>
    apiClient.patch<TemplateApiDto>(API.templates.detail(templateId), payload),

  delete: (templateId: string): Promise<void> =>
    apiClient.delete(API.templates.detail(templateId)) as Promise<void>,
};
