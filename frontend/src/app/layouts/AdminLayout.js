import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, Outlet } from 'react-router-dom';
import { Button } from '@shared/components/ui';
import { ToastRenderer } from '@shared/components/Toast';
import { useAuthStore } from '@app/store/auth.store';
import styles from './AdminLayout.module.css';
function navLinkClass({ isActive }) {
    return [styles.link, isActive ? styles.linkActive : ''].filter(Boolean).join(' ');
}
export function AdminLayout() {
    const clearAuth = useAuthStore((s) => s.clearAuth);
    return (_jsxs("div", { className: styles.shell, children: [_jsxs("header", { className: styles.top, children: [_jsx("div", { className: styles.brand, children: "Platform admin" }), _jsxs("nav", { className: styles.nav, children: [_jsx(NavLink, { to: "/admin/payments", className: navLinkClass, children: "Payments" }), _jsx(NavLink, { to: "/admin/tenants", className: navLinkClass, children: "Tenants" }), _jsx(NavLink, { to: "/admin/users", className: navLinkClass, children: "Users" }), _jsx(NavLink, { to: "/admin/subscriptions", className: navLinkClass, children: "Subscriptions" }), _jsx(NavLink, { to: "/admin/dashboard", className: navLinkClass, children: "Dashboard" })] }), _jsx(Button, { variant: "secondary", size: "sm", onClick: () => clearAuth(), children: "Sign out" })] }), _jsx("main", { className: styles.main, children: _jsx(Outlet, {}) }), _jsx(ToastRenderer, {})] }));
}
