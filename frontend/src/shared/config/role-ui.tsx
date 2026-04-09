import React from 'react';
import type { Role } from '@shared/types/auth.types';

export interface NavItemConfig {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const icon = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  tasks: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  ),
  employees: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  kpi: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  payroll: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M12 15h.01" />
    </svg>
  ),
  reports: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  billing: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M7 15h3" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
};

const NAV_BY_ROLE: Record<Role, NavItemConfig[]> = {
  ADMIN: [
    { to: '/dashboard', label: 'Dashboard', icon: icon.dashboard },
    { to: '/employees', label: 'Employees', icon: icon.employees },
    { to: '/tasks', label: 'Tasks', icon: icon.tasks },
    { to: '/kpi', label: 'KPI', icon: icon.kpi },
    { to: '/payroll', label: 'Payroll', icon: icon.payroll },
    { to: '/reports', label: 'Reports', icon: icon.reports },
    { to: '/billing', label: 'Billing', icon: icon.billing },
    { to: '/settings', label: 'Settings', icon: icon.settings },
  ],
  MANAGER: [
    { to: '/dashboard', label: 'Dashboard', icon: icon.dashboard },
    { to: '/tasks', label: 'Team Tasks', icon: icon.tasks },
    { to: '/kpi', label: 'Team KPI', icon: icon.kpi },
    { to: '/reports', label: 'Reports', icon: icon.reports },
    { to: '/settings', label: 'Settings', icon: icon.settings },
  ],
  EMPLOYEE: [
    { to: '/tasks', label: 'My Tasks', icon: icon.tasks },
    { to: '/kpi', label: 'My KPI', icon: icon.kpi },
    { to: '/payroll', label: 'My Payroll', icon: icon.payroll },
    { to: '/settings', label: 'Settings', icon: icon.settings },
  ],
};

const ALLOWED_ROLES_BY_ROUTE: Record<string, Role[]> = {
  '/dashboard': ['ADMIN', 'MANAGER'],
  '/employees': ['ADMIN'],
  '/tasks': ['ADMIN', 'MANAGER', 'EMPLOYEE'],
  '/kpi': ['ADMIN', 'MANAGER', 'EMPLOYEE'],
  '/payroll': ['ADMIN', 'EMPLOYEE'],
  '/reports': ['ADMIN', 'MANAGER'],
  '/billing': ['ADMIN'],
  '/settings': ['ADMIN', 'MANAGER', 'EMPLOYEE'],
};

export function getNavByRole(role: Role): NavItemConfig[] {
  return NAV_BY_ROLE[role];
}

export function canAccessRoute(role: Role, path: string): boolean {
  const basePath = `/${path.split('/').filter(Boolean)[0] ?? ''}`;
  const allowed = ALLOWED_ROLES_BY_ROUTE[basePath];
  if (!allowed) return true;
  return allowed.includes(role);
}

export function getHomeRouteByRole(role: Role): string {
  return NAV_BY_ROLE[role][0]?.to ?? '/tasks';
}
