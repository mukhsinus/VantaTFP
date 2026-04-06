import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SuperAdminDashboard.module.css';

interface Tenant {
  id: string;
  name: string;
  plan: 'FREE' | 'PRO';
  users_count: number;
  created_at: string;
}

interface SuperAdminStats {
  totalTenants: number;
  freeTenants: number;
  proTenants: number;
  totalUsers: number;
  totalSuperAdmins: number;
}

export function SuperAdminDashboard() {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradingId, setUpgradingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/tenants');
      if (!response.ok) throw new Error('Failed to load tenants');
      const data = await response.json();
      setTenants(data);

      // Calculate stats
      const stats = {
        totalTenants: data.length,
        freeTenants: data.filter((t: any) => t.plan === 'FREE').length,
        proTenants: data.filter((t: any) => t.plan === 'PRO').length,
        totalUsers: data.reduce((sum: number, t: any) => sum + (t.users_count || 0), 0),
        totalSuperAdmins: 0,
      };
      setStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tenantId: string) => {
    try {
      setUpgradingId(tenantId);
      const response = await fetch(`/api/admin/tenants/${tenantId}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'PRO' }),
      });

      if (!response.ok) throw new Error('Upgrade failed');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upgrade failed');
    } finally {
      setUpgradingId(null);
    }
  };

  const handleDowngrade = async (tenantId: string) => {
    if (!confirm('Are you sure you want to downgrade this tenant to FREE plan?')) return;

    try {
      setUpgradingId(tenantId);
      const response = await fetch(`/api/admin/tenants/${tenantId}/downgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'FREE' }),
      });

      if (!response.ok) throw new Error('Downgrade failed');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Downgrade failed');
    } finally {
      setUpgradingId(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <p>Loading platform data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🛡️ Super Admin Dashboard</h1>
          <p className={styles.subtitle}>Manage all tenants and plans across the VantaTFP platform</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Statistics Grid */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏢</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.totalTenants}</div>
              <div className={styles.statLabel}>Total Tenants</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.freeTenants}</div>
              <div className={styles.statLabel}>FREE Plan</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>⭐</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.proTenants}</div>
              <div className={styles.statLabel}>PRO Plan</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.totalUsers}</div>
              <div className={styles.statLabel}>Total Users</div>
            </div>
          </div>
        </div>
      )}

      {/* Tenants Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Platform Tenants</h2>
          <span className={styles.badge}>{tenants.length} total</span>
        </div>

        {tenants.length === 0 ? (
          <div className={styles.empty}>
            <p>No tenants found</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {tenants.map((tenant) => (
              <div key={tenant.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.tenantName}>{tenant.name}</h3>
                  <span className={`${styles.planBadge} ${styles[tenant.plan.toLowerCase()]}`}>
                    {tenant.plan}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.info}>
                    <span className={styles.label}>Users:</span>
                    <span className={styles.value}>{tenant.users_count}</span>
                  </div>
                  <div className={styles.info}>
                    <span className={styles.label}>Created:</span>
                    <span className={styles.value}>
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  {tenant.plan === 'FREE' ? (
                    <button
                      onClick={() => handleUpgrade(tenant.id)}
                      disabled={upgradingId === tenant.id}
                      className={styles.upgradeBtn}
                    >
                      {upgradingId === tenant.id ? 'Upgrading...' : '⬆️ Upgrade to PRO'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDowngrade(tenant.id)}
                      disabled={upgradingId === tenant.id}
                      className={styles.downgradeBtn}
                    >
                      {upgradingId === tenant.id ? 'Processing...' : '⬇️ Downgrade to FREE'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <p>🔒 This is a restricted admin panel. All actions are logged and audited.</p>
      </div>
    </div>
  );
}
