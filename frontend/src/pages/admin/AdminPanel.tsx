import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './AdminPanel.module.css';

interface Tenant {
  id: string;
  name: string;
  plan: 'FREE' | 'PRO';
  createdAt: string;
  _count: { users: number };
}

export function AdminPanel() {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/admin/tenants');
      const data = await response.json();
      setTenants(data);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgradeTenant = async (tenantId: string, newPlan: 'PRO') => {
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      });

      if (response.ok) {
        fetchTenants();
        alert('Tenant upgraded successfully');
      }
    } catch (error) {
      console.error('Failed to upgrade tenant:', error);
      alert('Failed to upgrade tenant');
    }
  };

  const downgradeTenant = async (tenantId: string, newPlan: 'FREE') => {
    if (window.confirm('Are you sure you want to downgrade this tenant?')) {
      try {
        const response = await fetch(`/api/admin/tenants/${tenantId}/downgrade`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: newPlan }),
        });

        if (response.ok) {
          fetchTenants();
          alert('Tenant downgraded successfully');
        }
      } catch (error) {
        console.error('Failed to downgrade tenant:', error);
        alert('Failed to downgrade tenant');
      }
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading tenants...</div>;
  }

  return (
    <div className={styles.container}>
      <h1>Admin Panel - Manage Tenants</h1>

      <div className={styles.tenantsGrid}>
        {tenants.map((tenant) => (
          <div key={tenant.id} className={styles.tenantCard}>
            <div className={styles.tenantHeader}>
              <h3>{tenant.name}</h3>
              <span className={`${styles.badge} ${styles[tenant.plan.toLowerCase()]}`}>
                {tenant.plan}
              </span>
            </div>

            <div className={styles.tenantDetails}>
              <p>
                <strong>Users:</strong> {tenant._count.users}
              </p>
              <p>
                <strong>Created:</strong> {new Date(tenant.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className={styles.actions}>
              {tenant.plan === 'FREE' && (
                <button
                  onClick={() => upgradeTenant(tenant.id, 'PRO')}
                  className={styles.buttonUpgrade}
                >
                  Upgrade to PRO
                </button>
              )}
              {tenant.plan === 'PRO' && (
                <button
                  onClick={() => downgradeTenant(tenant.id, 'FREE')}
                  className={styles.buttonDowngrade}
                >
                  Downgrade to FREE
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
