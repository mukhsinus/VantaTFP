import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router-dom';
import { Button } from '@shared/components/ui';
import { ToastRenderer } from '@shared/components/Toast';
import { useAuthStore } from '@app/store/auth.store';
import styles from './AdminLayout.module.css';

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [styles.link, isActive ? styles.linkActive : ''].filter(Boolean).join(' ');
}

export function AdminLayout() {
  const { t } = useTranslation();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <div className={styles.brand}>Platform admin</div>
        <nav className={styles.nav}>
          <NavLink to="/admin/payments" className={navLinkClass}>
            {t('admin.payments', 'Payments')}
          </NavLink>
          <NavLink to="/admin/tenants" className={navLinkClass}>
            {t('admin.tenants', 'Tenants')}
          </NavLink>
          <NavLink to="/admin/users" className={navLinkClass}>
            {t('admin.users', 'Users')}
          </NavLink>
          <NavLink to="/admin/subscriptions" className={navLinkClass}>
            {t('admin.subscriptions', 'Subscriptions')}
          </NavLink>
          <NavLink to="/admin/dashboard" className={navLinkClass}>
            {t('nav.dashboard', 'Dashboard')}
          </NavLink>
        </nav>
        <Button variant="secondary" size="sm" onClick={() => clearAuth()}>
          {t('common.logout', 'Sign out')}
        </Button>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <ToastRenderer />
    </div>
  );
}
