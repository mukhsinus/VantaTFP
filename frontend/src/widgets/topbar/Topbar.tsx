import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Badge } from '@shared/components/ui';
import { LanguageSwitcher } from '@shared/components/language-switcher/LanguageSwitcher';
import { useAuthStore } from '@app/store/auth.store';
import { useSidebarStore } from '@app/store/sidebar.store';
import { getNavByRole } from '@shared/config/role-ui';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { useUnreadNotifications } from '@features/notifications/hooks/useNotifications';
import styles from './Topbar.module.css';

const mobileSubtitleKeys: Partial<Record<string, string>> = {
  '/dashboard': 'overview.subtitle',
  '/kpi': 'kpi.subtitle',
  '/payroll': 'payroll.subtitle',
  '/reports': 'reports.subtitle',
  '/billing': 'billing.subtitle',
  '/settings': 'settings.subtitle',
};

const roleVariant: Record<string, 'accent' | 'warning' | 'success'> = {
  ADMIN: 'danger' as never,
  MANAGER: 'warning',
  EMPLOYEE: 'success',
};

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

export function Topbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { role } = useCurrentUser();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const toggleSidebar = useSidebarStore((s) => s.toggleCollapsed);
  const isMobile = useIsMobile();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const unread = useUnreadNotifications();
  const navItems = user ? getNavByRole(user.role) : [];

  const baseRoute = '/' + location.pathname.split('/')[1];
  const title = t(`nav.${baseRoute.slice(1)}`, {
    defaultValue: NAV_LABEL_FALLBACK_BY_ROUTE[baseRoute] ?? NAV_LABEL_FALLBACK_BY_ROUTE['/dashboard'],
  });
  const subtitleKey = mobileSubtitleKeys[baseRoute];
  const fullName = user ? `${user.firstName} ${user.lastName}` : '';

  useEffect(() => {
    setIsMobileNavOpen(false);
    setIsAccountSheetOpen(false);
    setIsNotificationsOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isAccountSheetOpen && !isMobileNavOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false);
        setIsAccountSheetOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isAccountSheetOpen, isMobileNavOpen]);

  useEffect(() => {
    if (!isNotificationsOpen) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-notification-panel]')) return;
      setIsNotificationsOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [isNotificationsOpen]);

  const closeMobileNav = () => setIsMobileNavOpen(false);
  const closeAccountSheet = () => setIsAccountSheetOpen(false);

  const goToSettings = () => {
    closeAccountSheet();
    navigate('/settings');
  };

  const handleLogout = () => {
    closeAccountSheet();
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <header className={`${styles.header} ${isMobile ? styles.headerMobile : styles.headerDesktop}`}>
      {!isMobile && (
        <button
          onClick={toggleSidebar}
          title={t('sidebar.toggle') ?? t('nav.actions.toggleSidebar')}
          className={styles.toggleButton}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      {isMobile ? (
        <>
          <button
            onClick={() => setIsMobileNavOpen(true)}
            aria-label={t('nav.account.openMenu')}
            className={styles.mobileMenuButton}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className={styles.mobileTitleWrap}>
            <h1 className={`${styles.title} ${styles.titleMobile}`}>{title}</h1>
            {subtitleKey && <p className={styles.mobileSubtitle}>{t(subtitleKey)}</p>}
          </div>
        </>
      ) : (
        <h1 className={styles.title}>{title}</h1>
      )}

      <div className={`${styles.actions} ${isMobile ? styles.actionsMobile : ''}`}>
        {!isMobile && <LanguageSwitcher />}
        {!isMobile && <div className={styles.divider} />}

        {user && (
          <div style={{ position: 'relative' }} data-notification-panel>
            <button
              onClick={() => setIsNotificationsOpen((v) => !v)}
              style={{
                position: 'relative',
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {(unread.data?.length ?? 0) > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 999,
                    background: 'var(--color-danger)',
                    color: '#fff',
                    fontSize: 10,
                    lineHeight: '16px',
                    textAlign: 'center',
                    padding: '0 4px',
                  }}
                >
                  {Math.min(unread.data?.length ?? 0, 99)}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 42,
                  width: 320,
                  maxHeight: 360,
                  overflowY: 'auto',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: 10,
                  zIndex: 30,
                }}
              >
                <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 'var(--text-sm)' }}>Notifications</p>
                {!unread.data?.length ? (
                  <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                    No unread notifications.
                  </p>
                ) : (
                  unread.data.map((item) => (
                    <div key={item.id} style={{ borderTop: '1px solid var(--color-border)', padding: '8px 0' }}>
                      <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600 }}>{item.title}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                        {item.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {user && (
          <div className={styles.userSection}>
            {isMobile ? (
              <button
                onClick={() => setIsAccountSheetOpen(true)}
                aria-label={t('nav.account.openMenu')}
                className={styles.userButtonMobile}
              >
                <Avatar name={fullName} size="sm" />
              </button>
            ) : (
              <Avatar name={fullName} size="sm" />
            )}
            {!isMobile && (
              <div className={styles.userInfo}>
                <h2 className={styles.userName}>
                  {user.firstName} {user.lastName}
                </h2>
                <div className={styles.userBadge}>
                  <Badge variant={roleVariant[user.role] ?? 'default'}>
                    {user.role === 'ADMIN'
                      ? t('profile.roles.admin')
                      : user.role === 'MANAGER'
                        ? t('profile.roles.manager')
                        : t('profile.roles.employee')}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isMobile && user && isMobileNavOpen &&
        createPortal(
          <div className={styles.mobileNavRoot}>
            <button
              onClick={closeMobileNav}
              aria-label={t('nav.account.closeSheet')}
              className={styles.mobileNavBackdrop}
            />
            <nav className={styles.mobileNavDrawer} aria-label="Mobile menu">
              <div className={styles.mobileNavHeader}>
                <p className={styles.mobileNavTitle}>
                  {t('nav.section.main', { defaultValue: 'Navigation' })}
                </p>
                <button
                  onClick={closeMobileNav}
                  aria-label={t('nav.account.closeSheet')}
                  className={styles.mobileNavClose}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className={styles.mobileNavList}>
                {navItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.to);
                  const navLabel = t(item.label, {
                    defaultValue: NAV_LABEL_FALLBACK_BY_ROUTE[item.to] ?? item.label,
                  });
                  return (
                    <button
                      key={item.to}
                      onClick={() => {
                        closeMobileNav();
                        navigate(item.to);
                      }}
                      className={`${styles.mobileNavItem} ${isActive ? styles.mobileNavItemActive : ''}`}
                    >
                      <span className={styles.mobileNavIcon}>{item.icon}</span>
                      <span>{navLabel}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>,
          document.body
        )}

      {isMobile && user && isAccountSheetOpen &&
        createPortal(
          <div className={styles.mobileSheet}>
            <button
              onClick={closeAccountSheet}
              aria-label={t('nav.account.closeSheet')}
              className={styles.sheetBackdrop}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t('nav.account.actionsTitle')}
              className={styles.sheetContent}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                background: 'var(--color-bg)',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                borderTop: '1px solid var(--color-border)',
                boxShadow: '0 -12px 32px rgba(0,0,0,0.16)',
                padding: '12px 16px calc(20px + env(safe-area-inset-bottom))',
              }}
            >
              <div className={styles.sheetHandle} />

              <div className={styles.sheetSection}>
                <p className={styles.sheetSectionTitle}>{t('settings.profile.title')}</p>
                <div className={styles.sheetUserSection}>
                  <Avatar name={fullName} size="md" />
                  <div className={styles.sheetUserInfo}>
                    <p className={styles.sheetUserName}>{fullName}</p>
                    <div className={styles.sheetUserBadge}>
                      <Badge variant={roleVariant[user.role] ?? 'default'}>
                        {user.role === 'ADMIN'
                          ? t('profile.roles.admin')
                          : user.role === 'MANAGER'
                            ? t('profile.roles.manager')
                            : t('profile.roles.employee')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.sheetSection}>
                <p className={styles.sheetSectionTitle}>{t('common.languageSwitcher')}</p>
                <div className={styles.sheetLanguage}>
                  <LanguageSwitcher fullWidth />
                </div>
              </div>

              <div className={styles.sheetSection}>
                <p className={styles.sheetSectionTitle}>{t('nav.account.actionsTitle')}</p>
                <div className={styles.sheetActions}>
                  <button onClick={goToSettings} className={styles.sheetActionButton}>
                    {t('nav.labels.settings')}
                  </button>
                  <button
                    onClick={handleLogout}
                    className={`${styles.sheetActionButton} ${styles.sheetActionButtonDanger}`}
                  >
                    {t('nav.labels.logout')}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
