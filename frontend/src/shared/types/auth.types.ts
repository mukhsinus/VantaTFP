export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface CurrentUser {
  userId: string;
  tenantId: string;
  tenantName: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}
