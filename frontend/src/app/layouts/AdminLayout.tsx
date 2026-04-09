import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Button } from '@shared/components/ui';
import { ToastRenderer } from '@shared/components/Toast';
import { useAuthStore } from '@app/store/auth.store';
import styles from './AdminLayout.module.css';

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [styles.link, isActive ? styles.linkActive : ''].filter(Boolean).join(' ');
}

export function AdminLayout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <div className={styles.brand}>Platform admin</div>
        <nav className={styles.nav}>
          <NavLink to="/admin/dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/tenants" className={navLinkClass}>
            Tenants
          </NavLink>
          <NavLink to="/admin/users" className={navLinkClass}>
            Users
          </NavLink>
          <NavLink to="/admin/subscriptions" className={navLinkClass}>
            Subscriptions
          </NavLink>
        </nav>
        <Button variant="secondary" size="sm" onClick={() => clearAuth()}>
          Sign out
        </Button>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <ToastRenderer />
    </div>
  );
}
