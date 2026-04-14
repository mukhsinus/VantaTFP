import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '@app/store/auth.store';
import { getNavByRole } from '@shared/config/role-ui';
import styles from './MobileBottomTabs.module.css';
export function MobileBottomTabs() {
    const location = useLocation();
    const user = useAuthStore((s) => s.user);
    const tabs = (user ? getNavByRole(user.role) : []).slice(0, 5);
    return (_jsx("nav", { className: styles.nav, children: tabs.map((tab) => {
            const active = location.pathname.startsWith(tab.to);
            return (_jsxs(NavLink, { to: tab.to, className: `${styles.tab} ${active ? styles.tabActive : ''}`, children: [tab.icon, _jsx("span", { children: tab.label })] }, tab.to));
        }) }));
}
