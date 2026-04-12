import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
const card = {
    display: 'block',
    padding: 20,
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    textDecoration: 'none',
    color: 'var(--color-text-primary)',
    fontWeight: 600,
    boxShadow: 'var(--shadow-xs)',
};
export function AdminDashboardPage() {
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 20 }, children: [_jsxs("div", { children: [_jsx("h1", { style: { fontSize: 'var(--text-2xl)', fontWeight: 700, margin: 0 }, children: "Admin dashboard" }), _jsx("p", { style: { color: 'var(--color-text-secondary)', marginTop: 8, maxWidth: 560 }, children: "Platform scope only \u2014 tenant workspace (tasks, employees, billing per tenant) is not available here." })] }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 14,
                }, children: [_jsx(Link, { to: "/admin/tenants", style: card, children: "Tenants" }), _jsx(Link, { to: "/admin/users", style: card, children: "Users" }), _jsx(Link, { to: "/admin/subscriptions", style: card, children: "Subscriptions" })] })] }));
}
