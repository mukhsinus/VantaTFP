import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@app/store/auth.store';
import { getNavByRole } from '@shared/config/role-ui';
import styles from './MobileBottomTabs.module.css';

const MOBILE_PRIMARY_ROUTES = ['/dashboard', '/tasks', '/employees', '/kpi', '/payroll'] as const;
const NAV_LABEL_FALLBACK_BY_ROUTE: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/tasks': 'Tasks',
  '/kpi': 'KPI',
  '/payroll': 'Payroll',
  '/messages': 'Messages',
  '/reports': 'Reports',
  '/billing': 'Billing',
  '/settings': 'Settings',
};

export function MobileBottomTabs() {
  const { t } = useTranslation();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const tabs = (user ? getNavByRole(user.role) : []).filter((tab) =>
    MOBILE_PRIMARY_ROUTES.includes(tab.to as (typeof MOBILE_PRIMARY_ROUTES)[number])
  );

  return (
    <nav className={styles.nav} aria-label="Primary mobile navigation">
      {tabs.map((tab) => {
        const active = location.pathname.startsWith(tab.to);
        const label = t(tab.label, {
          defaultValue: NAV_LABEL_FALLBACK_BY_ROUTE[tab.to] ?? tab.label,
        });
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            aria-label={label}
          >
            {tab.icon}
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
