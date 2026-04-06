import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@shared/components/ui';
import { useAuthStore } from '@app/store/auth.store';
import { useSidebarStore } from '@app/store/sidebar.store';
import styles from './Sidebar.module.css';

interface NavItem {
  to: string;
  labelKey: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    labelKey: 'nav.overview',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    to: '/employees',
    labelKey: 'nav.employees',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    to: '/payroll',
    labelKey: 'nav.payroll',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M12 15h.01" />
      </svg>
    ),
  },
  {
    to: '/settings',
    labelKey: 'nav.settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const location = useLocation();
  const navigate = useNavigate();
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);

  const sidebarWidth = isCollapsed ? 64 : 224;

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <nav
      className={styles.nav}
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
      }}
    >
      {/* Logo / Branding */}
      <div className={styles.header}>
        <div className={styles.branding}>
          <div className={styles.logo}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          {!isCollapsed && (
            <div className={styles.brandingText}>
              <p className={styles.brandingTitle}>{t('common.brand.shortName')}</p>
              <p className={styles.brandingSubtitle}>{user?.tenantName ?? t('nav.workspace.fallbackName')}</p>
            </div>
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={toggleCollapsed}
          title={
            isCollapsed
              ? t('sidebar.expand') || t('nav.actions.expandSidebar')
              : t('sidebar.collapse') || t('nav.actions.collapseSidebar')
          }
          className={styles.toggleButton}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className={`${styles.toggleIcon} ${isCollapsed ? styles.toggleIconCollapsed : ''}`}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <div className={styles.navList}>
        <p className={`${styles.navLabel} ${isCollapsed ? styles.navLabelCollapsed : ''}`}>
          {t('nav.section.main')}
        </p>
        {navItems.map((item) => (
          <SidebarItem
            key={item.to}
            item={item}
            active={location.pathname.startsWith(item.to)}
            isCollapsed={isCollapsed}
          />
        ))}
      </div>

      {/* User footer */}
      {user && (
        <div className={styles.footer}>
          <div className={styles.userCard}>
            <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
            {!isCollapsed && (
              <div className={styles.userInfo}>
                <p className={styles.userName}>
                  {user.firstName} {user.lastName}
                </p>
                <p className={styles.userRole}>
                  {user.role === 'ADMIN'
                    ? t('profile.roles.admin')
                    : user.role === 'MANAGER'
                      ? t('profile.roles.manager')
                      : t('profile.roles.employee')}
                </p>
              </div>
            )}
            <button
              onClick={handleLogout}
              title={t('nav.labels.logout')}
              className={styles.logoutButton}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

function SidebarItem({
  item,
  active,
  isCollapsed,
}: {
  item: NavItem;
  active: boolean;
  isCollapsed: boolean;
}) {
  const { t } = useTranslation();

  return (
    <NavLink
      to={item.to}
      title={isCollapsed ? t(item.labelKey) : undefined}
      className={`${styles.navItem} ${active ? styles.navItemActive : ''} ${
        isCollapsed ? styles.navItemCollapsed : ''
      }`}
    >
      <span className={styles.navItemIcon}>{item.icon}</span>
      {!isCollapsed && (
        <>
          <span className={styles.navItemLabel}>{t(item.labelKey)}</span>
          {active && <span className={styles.navItemDot} />}
        </>
      )}
      {isCollapsed && active && <span className={styles.navItemDot} />}
    </NavLink>
  );
}
