import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '@app/store/auth.store';
import { useFeatureFlagsStore } from '@app/store/feature-flags.store';
import { getNavByRole } from '@shared/config/role-ui';
import type { FeatureKey } from '@entities/feature-flags/feature-flags.types';
import styles from './MobileBottomTabs.module.css';

const ROUTE_FEATURE_MAP: Record<string, FeatureKey> = {
  '/projects': 'projects',
  '/documents': 'documents',
  '/automations': 'automations',
  '/templates': 'templates',
};

export function MobileBottomTabs() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isFeatureEnabled = useFeatureFlagsStore((s) => s.isEnabled);
  const allTabs = user ? getNavByRole(user.role) : [];
  const tabs = allTabs
    .filter((item) => {
      const featureKey = ROUTE_FEATURE_MAP[item.to];
      return !featureKey || isFeatureEnabled(featureKey);
    })
    .slice(0, 5);

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
