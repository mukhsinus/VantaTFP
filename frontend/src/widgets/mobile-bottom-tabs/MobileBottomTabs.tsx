import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface TabItem {
  to: string;
  labelKey: string;
  icon: React.ReactNode;
}

const tabs: TabItem[] = [
  {
    to: '/dashboard',
    labelKey: 'nav.dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: '/tasks',
    labelKey: 'nav.tasks',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    to: '/employees',
    labelKey: 'nav.employees',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    to: '/kpi',
    labelKey: 'nav.kpi',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    to: '/payroll',
    labelKey: 'nav.payroll',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M12 15h.01" />
      </svg>
    ),
  },
];

export function MobileBottomTabs() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 'var(--z-topbar)' as React.CSSProperties['zIndex'],
        background: 'var(--color-bg)',
        borderTop: '1px solid var(--color-border)',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        padding: '6px 6px calc(6px + env(safe-area-inset-bottom))',
      }}
    >
      {tabs.map((tab) => {
        const active = location.pathname.startsWith(tab.to);
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            style={{
              textDecoration: 'none',
              color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minHeight: 48,
              borderRadius: 'var(--radius)',
              background: active ? 'var(--color-accent-subtle)' : 'transparent',
              transition: 'all var(--transition-fast)',
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {tab.icon}
            <span>{t(tab.labelKey)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
