import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Badge } from '@shared/components/ui';
import { LanguageSwitcher } from '@shared/components/language-switcher/LanguageSwitcher';
import { useAuthStore } from '@app/store/auth.store';
import { useSidebarStore } from '@app/store/sidebar.store';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import styles from './Topbar.module.css';

const pageTitles: Record<string, string> = {
  '/dashboard': 'nav.overview',
  '/tasks': 'nav.tasks',
  '/employees': 'nav.employees',
  '/kpi': 'nav.kpi',
  '/payroll': 'nav.payroll',
  '/settings': 'nav.settings',
};

const mobileSubtitleKeys: Partial<Record<string, string>> = {
  '/dashboard': 'overview.subtitle',
  '/kpi': 'kpi.subtitle',
  '/payroll': 'payroll.subtitle',
  '/settings': 'settings.subtitle',
};

const roleVariant: Record<string, 'accent' | 'warning' | 'success'> = {
  ADMIN: 'danger' as never,
  MANAGER: 'warning',
  EMPLOYEE: 'success',
};

export function Topbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const toggleSidebar = useSidebarStore((s) => s.toggleCollapsed);
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);

  const baseRoute = '/' + location.pathname.split('/')[1];
  const titleKey = pageTitles[baseRoute] ?? 'nav.overview';
  const subtitleKey = mobileSubtitleKeys[baseRoute];
  const fullName = user ? `${user.firstName} ${user.lastName}` : '';

  useEffect(() => {
    setIsAccountSheetOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isAccountSheetOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAccountSheetOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isAccountSheetOpen]);

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
      {/* Sidebar toggle button (desktop only) */}
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

      {/* Page title */}
      {isMobile ? (
        <div className={styles.mobileTitleWrap}>
          <h1 className={`${styles.title} ${styles.titleMobile}`}>{t(titleKey)}</h1>
          {subtitleKey && <p className={styles.mobileSubtitle}>{t(subtitleKey)}</p>}
        </div>
      ) : (
        <h1 className={styles.title}>{t(titleKey)}</h1>
      )}

      {/* Search */}
      {!isMobile && (
        <div className={styles.searchContainer}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </span>
            <input
              type="search"
              placeholder={t('topbar.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            <kbd className={styles.searchShortcut}>{t('topbar.shortcut')}</kbd>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={`${styles.actions} ${isMobile ? styles.actionsMobile : ''}`}>
        {!isMobile && <LanguageSwitcher />}

        {/* Notifications bell */}
        {!isMobile && (
          <button className={styles.notificationButton} aria-label={t('nav.notifications.title')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span className={styles.notificationDot} />
          </button>
        )}

        {/* Divider */}
        {!isMobile && <div className={styles.divider} />}

        {/* User */}
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
