import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type { ProjectApiDto, ProjectListResponse, CreateProjectPayload, UpdateProjectPayload } from './project.types';

export const projectApi = {
  list: (params?: Record<string, string | number | boolean | null | undefined>): Promise<ProjectListResponse> =>
    apiClient.get<ProjectListResponse>(API.projects.list, params),

  getById: (projectId: string): Promise<ProjectApiDto> =>
    apiClient.get<ProjectApiDto>(API.projects.detail(projectId)),

  create: (payload: CreateProjectPayload): Promise<ProjectApiDto> =>
    apiClient.post<ProjectApiDto>(API.projects.list, payload),

  update: (projectId: string, payload: UpdateProjectPayload): Promise<ProjectApiDto> =>
    apiClient.patch<ProjectApiDto>(API.projects.detail(projectId), payload),

  delete: (projectId: string): Promise<void> =>
    apiClient.delete(API.projects.detail(projectId)) as Promise<void>,
};
