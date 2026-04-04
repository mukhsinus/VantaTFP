/**
 * Permission system for Role-Based Access Control (RBAC).
 * Supports fine-grained permission control beyond simple role checks.
 */

export type Permission =
  // Task permissions
  | 'create:task'
  | 'read:task'
  | 'read:task:own'
  | 'update:task'
  | 'update:task:own'
  | 'delete:task'
  | 'delete:task:own'
  
  // User management
  | 'create:user'
  | 'read:user'
  | 'update:user'
  | 'delete:user'
  | 'manage:roles'
  
  // KPI management
  | 'create:kpi'
  | 'read:kpi'
  | 'update:kpi'
  | 'delete:kpi'
  | 'record:kpi_progress'
  
  // Payroll management
  | 'create:payroll'
  | 'read:payroll'
  | 'update:payroll'
  | 'approve:payroll'
  | 'delete:payroll'
  
  // Tenant management
  | 'read:tenant'
  | 'update:tenant'
  | 'manage:tenant_users'
  | 'invite:tenant_users'
  | 'admin:tenant'
  
  // Admin operations
  | 'admin:platform';

/**
 * Role-to-Permission mapping.
 * Default roles and their associated permissions.
 * Can be extended with custom roles per tenant.
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: [
    // Full admin access within tenant
    'create:task',
    'read:task',
    'update:task',
    'delete:task',
    'create:user',
    'read:user',
    'update:user',
    'delete:user',
    'manage:roles',
    'create:kpi',
    'read:kpi',
    'update:kpi',
    'delete:kpi',
    'record:kpi_progress',
    'create:payroll',
    'read:payroll',
    'update:payroll',
    'approve:payroll',
    'delete:payroll',
    'read:tenant',
    'update:tenant',
    'manage:tenant_users',
    'invite:tenant_users',
    'admin:tenant',
  ],
  
  MANAGER: [
    // Manager can view and manage own team
    'create:task',
    'read:task',
    'update:task',
    'delete:task',
    'read:user',
    'read:kpi',
    'record:kpi_progress',
    'read:payroll',
    'read:tenant',
    'manage:tenant_users', // Can invite users to their own team
  ],
  
  EMPLOYEE: [
    // Employee can manage own tasks and view team KPIs
    'create:task',
    'read:task',
    'read:task:own',
    'update:task:own',
    'delete:task:own',
    'read:user',
    'read:kpi',
    'record:kpi_progress',
  ],
};

/**
 * Check if a role has a specific permission.
 */
export function roleHasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] ?? [];
  return permissions.includes(permission);
}

/**
 * Get all permissions for a role.
 */
export function getRolePermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
