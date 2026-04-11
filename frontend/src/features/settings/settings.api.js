import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
export async function fetchMe() {
    return apiClient.get(API.users.me);
}
export async function patchProfile(body) {
    console.log('PATCH', API.users.profile, body);
    return apiClient.patch(API.users.profile, body);
}
export async function patchPassword(body) {
    console.log('PATCH', API.users.password, {
        currentPassword: '[REDACTED]',
        newPassword: '[REDACTED]',
    });
    return apiClient.patch(API.users.password, body);
}
export async function patchNotifications(body) {
    console.log('REQUEST BODY:', body);
    const res = await apiClient.patch(API.users.notifications, body);
    return res.notifications;
}
export async function patchTenantName(tenantId, body) {
    console.log('REQUEST BODY:', body);
    return apiClient.patch(API.tenants.detail(tenantId), body);
}
