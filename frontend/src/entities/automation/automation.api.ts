import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type { AutomationApiDto, AutomationListResponse, CreateAutomationPayload, UpdateAutomationPayload } from './automation.types';

export const automationApi = {
  list: (params?: Record<string, unknown>): Promise<AutomationListResponse> =>
    apiClient.get<AutomationListResponse>(API.automations.list, params),

  getById: (ruleId: string): Promise<AutomationApiDto> =>
    apiClient.get<AutomationApiDto>(API.automations.detail(ruleId)),

  create: (payload: CreateAutomationPayload): Promise<AutomationApiDto> =>
    apiClient.post<AutomationApiDto>(API.automations.list, payload),

  update: (ruleId: string, payload: UpdateAutomationPayload): Promise<AutomationApiDto> =>
    apiClient.patch<AutomationApiDto>(API.automations.detail(ruleId), payload),

  delete: (ruleId: string): Promise<void> =>
    apiClient.delete(API.automations.detail(ruleId)) as Promise<void>,
};
