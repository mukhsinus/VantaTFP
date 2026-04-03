import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type {
  UserApiDto,
  CreateUserPayload,
  UpdateUserPayload,
} from './users.types';

export const usersApi = {
  getUsers: (): Promise<UserApiDto[]> =>
    apiClient.get<UserApiDto[]>(API.users.list),

  createUser: (payload: CreateUserPayload): Promise<UserApiDto> =>
    apiClient.post<UserApiDto>(API.users.list, payload),

  updateUser: (id: string, payload: UpdateUserPayload): Promise<UserApiDto> =>
    apiClient.patch<UserApiDto>(API.users.detail(id), payload),

  deleteUser: (id: string): Promise<void> =>
    apiClient.delete<void>(API.users.detail(id)),
};
