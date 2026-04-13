import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '@app/store/auth.store';
import { getNavByRole } from '@shared/config/role-ui';
import styles from './MobileBottomTabs.module.css';

export function MobileBottomTabs() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const tabs = (user ? getNavByRole(user.role) : []).slice(0, 5);

  return (
    <nav className={styles.nav}>
      {tabs.map((tab) => {
        const active = location.pathname.startsWith(tab.to);
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
