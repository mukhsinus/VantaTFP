import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './AdminPanel.module.css';
export function AdminPanel() {
    const { t } = useTranslation();
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTenant, setSelectedTenant] = useState(null);
    useEffect(() => {
        fetchTenants();
    }, []);
    const fetchTenants = async () => {
        try {
            const response = await fetch('/api/admin/tenants');
            const data = await response.json();
            setTenants(data);
        }
        catch (error) {
            console.error('Failed to fetch tenants:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const upgradeTenant = async (tenantId, newPlan) => {
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
        }
        catch (error) {
            console.error('Failed to upgrade tenant:', error);
            alert('Failed to upgrade tenant');
        }
    };
    const downgradeTenant = async (tenantId, newPlan) => {
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
            }
            catch (error) {
                console.error('Failed to downgrade tenant:', error);
                alert('Failed to downgrade tenant');
            }
        }
    };
    if (loading) {
        return _jsx("div", { className: styles.loading, children: "Loading tenants..." });
    }
    return (_jsxs("div", { className: styles.container, children: [_jsx("h1", { children: "Admin Panel - Manage Tenants" }), _jsx("div", { className: styles.tenantsGrid, children: tenants.map((tenant) => (_jsxs("div", { className: styles.tenantCard, children: [_jsxs("div", { className: styles.tenantHeader, children: [_jsx("h3", { children: tenant.name }), _jsx("span", { className: `${styles.badge} ${styles[tenant.plan.toLowerCase()]}`, children: tenant.plan })] }), _jsxs("div", { className: styles.tenantDetails, children: [_jsxs("p", { children: [_jsx("strong", { children: "Users:" }), " ", tenant._count.users] }), _jsxs("p", { children: [_jsx("strong", { children: "Created:" }), " ", new Date(tenant.createdAt).toLocaleDateString()] })] }), _jsxs("div", { className: styles.actions, children: [tenant.plan === 'FREE' && (_jsx("button", { onClick: () => upgradeTenant(tenant.id, 'PRO'), className: styles.buttonUpgrade, children: "Upgrade to PRO" })), tenant.plan === 'PRO' && (_jsx("button", { onClick: () => downgradeTenant(tenant.id, 'FREE'), className: styles.buttonDowngrade, children: "Downgrade to FREE" }))] })] }, tenant.id))) })] }));
}
