import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type { NotificationDto } from './notifications.types';

export const notificationsApi = {
  unread: (): Promise<NotificationDto[]> =>
    apiClient.get<NotificationDto[]>(API.notifications.unread),
};
