import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@app/store/auth.store';
import { useSidebarStore } from '@app/store/sidebar.store';
import { getNavByRole } from '@shared/config/role-ui';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { MenuSection } from './MenuSection';
import { MenuItem } from './MenuItem';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isMobileOpen = useSidebarStore((s) => s.isMobileOpen);
  const closeMobile = useSidebarStore((s) => s.closeMobile);
  const navItems = user ? getNavByRole(user.role) : [];

  const sidebarWidth = 260;

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  const PRIMARY_ROUTES = ['/dashboard', '/employees', '/tasks', '/kpi', '/payroll'] as const;

  const [starred, setStarred] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = window.localStorage.getItem('nav-starred');
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('nav-starred', JSON.stringify(starred));
  }, [starred]);

  useEffect(() => {
    if (!isMobile) return;
    closeMobile();
  }, [closeMobile, isMobile, location.pathname, location.search]);

  const itemsByRoute = useMemo(() => {
    const map = new Map<string, (typeof navItems)[number]>();
    navItems.forEach((item) => map.set(item.to, item));
    return map;
  }, [navItems]);

  const primaryItems = PRIMARY_ROUTES.map((route) => itemsByRoute.get(route)).filter(Boolean) as typeof navItems;

  const quickItems = navItems.filter(
    (item) => !PRIMARY_ROUTES.includes(item.to as (typeof PRIMARY_ROUTES)[number]) && item.to !== '/settings'
  );

  const quickItemsSorted = [...quickItems].sort((a, b) => {
    const aStar = Boolean(starred[a.to]);
    const bStar = Boolean(starred[b.to]);
    if (aStar === bStar) return 0;
    return aStar ? -1 : 1;
  });

  const wrapperClass = isMobile ? styles.mobileRoot : styles.desktopRoot;

  const [isRendered, setIsRendered] = useState(false);
  const [isUiOpen, setIsUiOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      setIsRendered(true);
      setIsUiOpen(true);
      return;
    }

    if (isMobileOpen) {
      setIsRendered(true);
      // let the browser paint initial offscreen state first
      requestAnimationFrame(() => setIsUiOpen(true));
      return;
    }

    // store closed: animate out if needed
    setIsUiOpen(false);
  }, [isMobile, isMobileOpen]);

  const requestClose = () => {
    if (!isMobile) return;
    setIsUiOpen(false);
  };

  // Swipe-to-close on mobile
  const swipeRef = useRef<{ startX: number; startY: number; active: boolean }>({
    startX: 0,
    startY: 0,
    active: false,
  });

  const onTouchStart: React.TouchEventHandler = (e) => {
    const t0 = e.touches[0];
    if (!t0) return;
    swipeRef.current = { startX: t0.clientX, startY: t0.clientY, active: true };
  };

  const onTouchMove: React.TouchEventHandler = (e) => {
    if (!swipeRef.current.active) return;
    const t0 = e.touches[0];
    if (!t0) return;
    const dx = t0.clientX - swipeRef.current.startX;
    const dy = t0.clientY - swipeRef.current.startY;
    // close on confident left swipe, ignore vertical scroll
    if (dx < -64 && Math.abs(dy) < 36) {
      swipeRef.current.active = false;
      requestClose();
    }
  };

  const onTouchEnd: React.TouchEventHandler = () => {
    swipeRef.current.active = false;
  };

  if (isMobile && !isRendered) return null;

  return (
    <div className={wrapperClass}>
      {isMobile ? (
        <button
          className={`${styles.overlay} ${isUiOpen ? styles.overlayOpen : ''}`}
          aria-label="Close menu"
          onClick={requestClose}
        />
      ) : null}

      <nav
        className={`${styles.nav} ${isMobile ? styles.navMobile : ''} ${isMobile && isUiOpen ? styles.navMobileOpen : ''}`}
        aria-label="Main navigation"
        style={!isMobile ? { width: sidebarWidth, minWidth: sidebarWidth } : undefined}
        onTouchStart={isMobile ? onTouchStart : undefined}
        onTouchMove={isMobile ? onTouchMove : undefined}
        onTouchEnd={isMobile ? onTouchEnd : undefined}
        onTransitionEnd={(e) => {
          if (!isMobile) return;
          if (e.propertyName !== 'transform') return;
          // when closed animation finishes: sync store + unmount
          if (!isUiOpen) {
            closeMobile();
            setIsRendered(false);
          }
        }}
      >
        <div className={styles.header}>
          <div className={styles.brandRow}>
            <div className={styles.logo}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div className={styles.brandText}>
              <p className={styles.brandTitle}>VantaTFP</p>
              <p className={styles.brandSubtitle}>{user?.tenantName ?? t('nav.workspace.fallbackName')}</p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              onClick={() => (isMobile ? requestClose() : undefined)}
              aria-label="Close"
              className={styles.headerIconButton}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.content}>
          <MenuSection title={t('nav.section.main', { defaultValue: 'Primary' })}>
            {primaryItems.map((item) => (
              <MenuItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={t(item.label)}
                showStar
                starred={Boolean(starred[item.to])}
                onToggleStar={() => setStarred((s) => ({ ...s, [item.to]: !s[item.to] }))}
                onClick={() => {
                  if (isMobile) requestClose();
                }}
              />
            ))}
          </MenuSection>

          <MenuSection title={t('nav.section.quick', { defaultValue: 'Quick access' })}>
            {quickItemsSorted.map((item) => (
              <MenuItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={t(item.label)}
                showChevron
                showStar
                starred={Boolean(starred[item.to])}
                onToggleStar={() => setStarred((s) => ({ ...s, [item.to]: !s[item.to] }))}
                onClick={() => {
                  if (isMobile) requestClose();
                }}
              />
            ))}
          </MenuSection>
        </div>

        <div className={styles.system}>
          <MenuItem
            to="/settings"
            icon={itemsByRoute.get('/settings')?.icon}
            label={t('nav.labels.settings', { defaultValue: t('nav.settings') })}
            showChevron
            onClick={() => {
              if (isMobile) requestClose();
            }}
          />
          <MenuItem
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            }
            label={t('nav.labels.logout', { defaultValue: t('nav.logout') })}
            destructive
            onClick={handleLogout}
          />
        </div>
      </nav>
    </div>
  );
}
