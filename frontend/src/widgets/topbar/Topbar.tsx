import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@app/store/auth.store';
import { useSidebarStore } from '@app/store/sidebar.store';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { useUnreadNotifications } from '@features/notifications/hooks/useNotifications';
import styles from './Topbar.module.css';

const mobileSubtitleKeys: Partial<Record<string, string>> = {
  '/reports': 'reports.subtitle',
  '/billing': 'billing.subtitle',
  '/settings': 'settings.subtitle',
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
  const user = useAuthStore((s) => s.user);
  useCurrentUser();
  const openMobileNav = useSidebarStore((s) => s.openMobile);
  const isMobile = useIsMobile();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const unread = useUnreadNotifications();

  const baseRoute = '/' + location.pathname.split('/')[1];
  const title = t(`nav.${baseRoute.slice(1)}`, {
    defaultValue: NAV_LABEL_FALLBACK_BY_ROUTE[baseRoute] ?? NAV_LABEL_FALLBACK_BY_ROUTE['/dashboard'],
  });
  const subtitleKey = mobileSubtitleKeys[baseRoute];

  useEffect(() => {
    setIsNotificationsOpen(false);
  }, [location.pathname, location.search]);

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

  return (
    <header className={`${styles.header} ${isMobile ? styles.headerMobile : styles.headerDesktop}`}>
      {isMobile ? (
        <>
          <button
            onClick={openMobileNav}
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
                <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                  {t('nav.notifications.title', { defaultValue: 'Notifications' })}
                </p>
                {!unread.data?.length ? (
                  <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                    {t('common.notifications.empty', { defaultValue: 'No unread notifications.' })}
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
      </div>
    </header>
  );
}
