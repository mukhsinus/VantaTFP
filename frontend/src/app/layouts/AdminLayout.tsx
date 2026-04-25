import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router-dom';
import { adminApi } from '@entities/admin/admin.api';
import { Button } from '@shared/components/ui';
import { ToastRenderer } from '@shared/components/Toast';
import { useAuthStore } from '@app/store/auth.store';
import { useAdminScopeStore } from '@app/store/admin-scope.store';
import styles from './AdminLayout.module.css';

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [styles.link, isActive ? styles.linkActive : ''].filter(Boolean).join(' ');
}

export function AdminLayout() {
  const { t } = useTranslation();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const selectedTenantId = useAdminScopeStore((s) => s.selectedTenantId);
  const setSelectedTenantId = useAdminScopeStore((s) => s.setSelectedTenantId);
  const tenantsQuery = useQuery({
    queryKey: ['admin', 'tenants', 'scope'],
    queryFn: () => adminApi.listTenants({ page: 1, limit: 100 }),
  });

  React.useEffect(() => {
    const tenants = tenantsQuery.data?.data ?? [];
    if (!tenants.length) return;

    const selectedStillExists = selectedTenantId
      ? tenants.some((tenant) => tenant.id === selectedTenantId)
      : false;

    if (!selectedStillExists) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [selectedTenantId, setSelectedTenantId, tenantsQuery.data]);

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
        <div className={styles.scope}>
          <label htmlFor="admin-tenant-scope" className={styles.scopeLabel}>
            Tenant scope
          </label>
          <select
            id="admin-tenant-scope"
            className={styles.scopeSelect}
            value={selectedTenantId ?? ''}
            onChange={(event) => setSelectedTenantId(event.target.value || null)}
            disabled={tenantsQuery.isLoading || (tenantsQuery.data?.data.length ?? 0) === 0}
          >
            {(tenantsQuery.data?.data ?? []).map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </div>
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
