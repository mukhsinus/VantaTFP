import type { Role } from '@shared/types/auth.types';

export interface RoleNavItem {
  to: string;
  labelKey: string;
}

const ADMIN_NAV: RoleNavItem[] = [
  { to: '/dashboard', labelKey: 'nav.overview' },
  { to: '/employees', labelKey: 'nav.employees' },
  { to: '/tasks', labelKey: 'nav.tasks' },
  { to: '/kpi', labelKey: 'nav.kpi' },
  { to: '/payroll', labelKey: 'nav.payroll' },
  { to: '/reports', labelKey: 'nav.reports' },
  { to: '/billing', labelKey: 'nav.billing' },
];

const MANAGER_NAV: RoleNavItem[] = [
  { to: '/dashboard', labelKey: 'nav.overview' },
  { to: '/employees', labelKey: 'nav.employees' },
  { to: '/tasks', labelKey: 'nav.tasks' },
  { to: '/kpi', labelKey: 'nav.kpi' },
  { to: '/reports', labelKey: 'nav.reports' },
];

const EMPLOYEE_NAV: RoleNavItem[] = [
  { to: '/tasks', labelKey: 'nav.tasks' },
  { to: '/kpi', labelKey: 'nav.kpi' },
];

export function getNavigationForRole(role: Role | null | undefined): RoleNavItem[] {
  if (role === 'ADMIN') return ADMIN_NAV;
  if (role === 'MANAGER') return MANAGER_NAV;
  if (role === 'EMPLOYEE') return EMPLOYEE_NAV;
  return [];
}

export function getDefaultRouteForRole(role: Role | null | undefined): string {
  if (role === 'ADMIN' || role === 'MANAGER') return '/dashboard';
  if (role === 'EMPLOYEE') return '/tasks';
  return '/dashboard';
}

export function isRouteAllowedForRole(pathname: string, role: Role | null | undefined): boolean {
  const nav = getNavigationForRole(role);
  return nav.some((item) => pathname.startsWith(item.to));
}
