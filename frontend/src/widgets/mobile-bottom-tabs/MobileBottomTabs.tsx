import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@app/store/auth.store';
import { getNavByRole } from '@shared/config/role-ui';
import styles from './MobileBottomTabs.module.css';

const MOBILE_PRIMARY_ROUTES = ['/dashboard', '/tasks', '/employees', '/kpi', '/payroll'] as const;

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
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            aria-label={tab.label}
          >
            {tab.icon}
            <span>{t(tab.label)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
