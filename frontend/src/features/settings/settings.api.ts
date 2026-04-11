import { apiClient } from '@shared/api/client';
import { API } from '@shared/api/endpoints';
import type { CurrentUser } from '@shared/types/auth.types';

export type MeNotificationPrefs = {
  overdue_tasks: boolean;
  new_tasks: boolean;
  kpi_updates: boolean;
  payroll_requests: boolean;
};

export type MeWithNotifications = {
  userId: string;
  tenantId: string;
  tenantName: string;
  email: string;
  firstName: string;
  lastName: string;
  role: CurrentUser['role'];
  systemRole?: CurrentUser['systemRole'];
  notifications?: MeNotificationPrefs;
};

export type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function fetchMe(): Promise<MeWithNotifications> {
  return apiClient.get<MeWithNotifications>(API.users.me);
}

export async function patchProfile(body: {
  first_name: string;
  last_name: string;
  email: string;
}): Promise<MeWithNotifications> {
  console.log('PATCH', API.users.profile, body);
  return apiClient.patch<MeWithNotifications>(API.users.profile, body);
}

export async function patchPassword(body: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: boolean }> {
  console.log('PATCH', API.users.password, {
    currentPassword: '[REDACTED]',
    newPassword: '[REDACTED]',
  });
  return apiClient.patch<{ ok: boolean }>(API.users.password, body);
}

export async function patchNotifications(body: MeNotificationPrefs): Promise<MeNotificationPrefs> {
  console.log('REQUEST BODY:', body);
  const res = await apiClient.patch<{ notifications: MeNotificationPrefs }>(
    API.users.notifications,
    body
  );
  return res.notifications;
}

export async function patchTenantName(
  tenantId: string,
  body: { name: string }
): Promise<TenantSummary> {
  console.log('REQUEST BODY:', body);
  return apiClient.patch<TenantSummary>(API.tenants.detail(tenantId), body);
}
