import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@shared/components/ui';
import { useAuthStore } from '@app/store/auth.store';
import { useSidebarStore } from '@app/store/sidebar.store';
import { useFeatureFlagsStore } from '@app/store/feature-flags.store';
import { getNavByRole } from '@shared/config/role-ui';
import type { FeatureKey } from '@entities/feature-flags/feature-flags.types';
import styles from './Sidebar.module.css';

/** Maps route paths to feature flag keys. Routes not listed are always visible. */
const ROUTE_FEATURE_MAP: Record<string, FeatureKey> = {
  '/projects': 'projects',
  '/documents': 'documents',
  '/automations': 'automations',
  '/templates': 'templates',
};

export function Sidebar() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const location = useLocation();
  const navigate = useNavigate();
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const isFeatureEnabled = useFeatureFlagsStore((s) => s.isEnabled);
  const allNavItems = user ? getNavByRole(user.role) : [];
  const navItems = allNavItems.filter((item) => {
    const featureKey = ROUTE_FEATURE_MAP[item.to];
    return !featureKey || isFeatureEnabled(featureKey);
  });

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
  item: { to: string; label: string; icon: React.ReactNode };
  active: boolean;
  isCollapsed: boolean;
}) {
  const { t } = useTranslation();

  return (
    <NavLink
      to={item.to}
      title={isCollapsed ? t(item.label) : undefined}
      className={`${styles.navItem} ${active ? styles.navItemActive : ''} ${
        isCollapsed ? styles.navItemCollapsed : ''
      }`}
    >
      <span className={styles.navItemIcon}>{item.icon}</span>
      {!isCollapsed && (
        <>
          <span className={styles.navItemLabel}>{t(item.label)}</span>
          {active && <span className={styles.navItemDot} />}
        </>
      )}
      {isCollapsed && active && <span className={styles.navItemDot} />}
    </NavLink>
  );
}
