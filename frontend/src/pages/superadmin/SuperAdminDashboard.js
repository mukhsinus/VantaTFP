import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SuperAdminDashboard.module.css';
export function SuperAdminDashboard() {
    const { t } = useTranslation();
    const [tenants, setTenants] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [upgradingId, setUpgradingId] = useState(null);
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/tenants');
            if (!response.ok)
                throw new Error('Failed to load tenants');
            const data = await response.json();
            setTenants(data);
            // Calculate stats
            const stats = {
                totalTenants: data.length,
                freeTenants: data.filter((t) => t.plan === 'FREE').length,
                proTenants: data.filter((t) => t.plan === 'PRO').length,
                totalUsers: data.reduce((sum, t) => sum + (t.users_count || 0), 0),
                totalSuperAdmins: 0,
            };
            setStats(stats);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error loading data');
        }
        finally {
            setLoading(false);
        }
    };
    const handleUpgrade = async (tenantId) => {
        try {
            setUpgradingId(tenantId);
            const response = await fetch(`/api/admin/tenants/${tenantId}/upgrade`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: 'PRO' }),
            });
            if (!response.ok)
                throw new Error('Upgrade failed');
            await loadData();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Upgrade failed');
        }
        finally {
            setUpgradingId(null);
        }
    };
    const handleDowngrade = async (tenantId) => {
        if (!confirm('Are you sure you want to downgrade this tenant to FREE plan?'))
            return;
        try {
            setUpgradingId(tenantId);
            const response = await fetch(`/api/admin/tenants/${tenantId}/downgrade`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: 'FREE' }),
            });
            if (!response.ok)
                throw new Error('Downgrade failed');
            await loadData();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Downgrade failed');
        }
        finally {
            setUpgradingId(null);
        }
    };
    if (loading) {
        return (_jsx("div", { className: styles.container, children: _jsxs("div", { className: styles.loadingWrapper, children: [_jsx("div", { className: styles.spinner }), _jsx("p", { children: "Loading platform data..." })] }) }));
    }
    return (_jsxs("div", { className: styles.container, children: [_jsx("div", { className: styles.header, children: _jsxs("div", { children: [_jsx("h1", { className: styles.title, children: "\uD83D\uDEE1\uFE0F Super Admin Dashboard" }), _jsx("p", { className: styles.subtitle, children: "Manage all tenants and plans across the VantaTFP platform" })] }) }), error && (_jsxs("div", { className: styles.errorBanner, children: [_jsxs("span", { children: ["\u26A0\uFE0F ", error] }), _jsx("button", { onClick: () => setError(null), children: "\u2715" })] })), stats && (_jsxs("div", { className: styles.statsGrid, children: [_jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statIcon, children: "\uD83C\uDFE2" }), _jsxs("div", { className: styles.statContent, children: [_jsx("div", { className: styles.statValue, children: stats.totalTenants }), _jsx("div", { className: styles.statLabel, children: "Total Tenants" })] })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statIcon, children: "\uD83D\uDCCA" }), _jsxs("div", { className: styles.statContent, children: [_jsx("div", { className: styles.statValue, children: stats.freeTenants }), _jsx("div", { className: styles.statLabel, children: "FREE Plan" })] })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statIcon, children: "\u2B50" }), _jsxs("div", { className: styles.statContent, children: [_jsx("div", { className: styles.statValue, children: stats.proTenants }), _jsx("div", { className: styles.statLabel, children: "PRO Plan" })] })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statIcon, children: "\uD83D\uDC65" }), _jsxs("div", { className: styles.statContent, children: [_jsx("div", { className: styles.statValue, children: stats.totalUsers }), _jsx("div", { className: styles.statLabel, children: "Total Users" })] })] })] })), _jsxs("div", { className: styles.section, children: [_jsxs("div", { className: styles.sectionHeader, children: [_jsx("h2", { children: "Platform Tenants" }), _jsxs("span", { className: styles.badge, children: [tenants.length, " total"] })] }), tenants.length === 0 ? (_jsx("div", { className: styles.empty, children: _jsx("p", { children: "No tenants found" }) })) : (_jsx("div", { className: styles.grid, children: tenants.map((tenant) => (_jsxs("div", { className: styles.card, children: [_jsxs("div", { className: styles.cardHeader, children: [_jsx("h3", { className: styles.tenantName, children: tenant.name }), _jsx("span", { className: `${styles.planBadge} ${styles[tenant.plan.toLowerCase()]}`, children: tenant.plan })] }), _jsxs("div", { className: styles.cardBody, children: [_jsxs("div", { className: styles.info, children: [_jsx("span", { className: styles.label, children: "Users:" }), _jsx("span", { className: styles.value, children: tenant.users_count })] }), _jsxs("div", { className: styles.info, children: [_jsx("span", { className: styles.label, children: "Created:" }), _jsx("span", { className: styles.value, children: new Date(tenant.created_at).toLocaleDateString() })] })] }), _jsx("div", { className: styles.cardActions, children: tenant.plan === 'FREE' ? (_jsx("button", { onClick: () => handleUpgrade(tenant.id), disabled: upgradingId === tenant.id, className: styles.upgradeBtn, children: upgradingId === tenant.id ? 'Upgrading...' : '⬆️ Upgrade to PRO' })) : (_jsx("button", { onClick: () => handleDowngrade(tenant.id), disabled: upgradingId === tenant.id, className: styles.downgradeBtn, children: upgradingId === tenant.id ? 'Processing...' : '⬇️ Downgrade to FREE' })) })] }, tenant.id))) }))] }), _jsx("div", { className: styles.footer, children: _jsx("p", { children: "\uD83D\uDD12 This is a restricted admin panel. All actions are logged and audited." }) })] }));
}
