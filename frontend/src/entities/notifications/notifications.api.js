import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
export const notificationsApi = {
    unread: () => apiClient.get(API.notifications.unread),
};
