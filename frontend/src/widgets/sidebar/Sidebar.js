import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@shared/components/ui';
import { useAuthStore } from '@app/store/auth.store';
import { useSidebarStore } from '@app/store/sidebar.store';
import { getNavByRole } from '@shared/config/role-ui';
import styles from './Sidebar.module.css';
export function Sidebar() {
    const { t } = useTranslation();
    const user = useAuthStore((s) => s.user);
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const location = useLocation();
    const navigate = useNavigate();
    const isCollapsed = useSidebarStore((s) => s.isCollapsed);
    const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
    const navItems = user ? getNavByRole(user.role) : [];
    const sidebarWidth = isCollapsed ? 64 : 224;
    const handleLogout = () => {
        clearAuth();
        navigate('/login', { replace: true });
    };
    return (_jsxs("nav", { className: styles.nav, style: {
            width: sidebarWidth,
            minWidth: sidebarWidth,
        }, children: [_jsxs("div", { className: styles.header, children: [_jsxs("div", { className: styles.branding, children: [_jsx("div", { className: styles.logo, children: _jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: 2.5, children: _jsx("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" }) }) }), !isCollapsed && (_jsxs("div", { className: styles.brandingText, children: [_jsx("p", { className: styles.brandingTitle, children: t('common.brand.shortName') }), _jsx("p", { className: styles.brandingSubtitle, children: user?.tenantName ?? t('nav.workspace.fallbackName') })] }))] }), _jsx("button", { onClick: toggleCollapsed, title: isCollapsed
                            ? t('sidebar.expand') || t('nav.actions.expandSidebar')
                            : t('sidebar.collapse') || t('nav.actions.collapseSidebar'), className: styles.toggleButton, children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, className: `${styles.toggleIcon} ${isCollapsed ? styles.toggleIconCollapsed : ''}`, children: _jsx("polyline", { points: "15 18 9 12 15 6" }) }) })] }), _jsxs("div", { className: styles.navList, children: [_jsx("p", { className: `${styles.navLabel} ${isCollapsed ? styles.navLabelCollapsed : ''}`, children: t('nav.section.main') }), navItems.map((item) => (_jsx(SidebarItem, { item: item, active: location.pathname.startsWith(item.to), isCollapsed: isCollapsed }, item.to)))] }), user && (_jsx("div", { className: styles.footer, children: _jsxs("div", { className: styles.userCard, children: [_jsx(Avatar, { name: `${user.firstName} ${user.lastName}`, size: "sm" }), !isCollapsed && (_jsxs("div", { className: styles.userInfo, children: [_jsxs("p", { className: styles.userName, children: [user.firstName, " ", user.lastName] }), _jsx("p", { className: styles.userRole, children: user.role === 'ADMIN'
                                        ? t('profile.roles.admin')
                                        : user.role === 'MANAGER'
                                            ? t('profile.roles.manager')
                                            : t('profile.roles.employee') })] })), _jsx("button", { onClick: handleLogout, title: t('nav.labels.logout'), className: styles.logoutButton, children: _jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { d: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" }) }) })] }) }))] }));
}
function SidebarItem({ item, active, isCollapsed, }) {
    const { t } = useTranslation();
    return (_jsxs(NavLink, { to: item.to, title: isCollapsed ? t(item.label) : undefined, className: `${styles.navItem} ${active ? styles.navItemActive : ''} ${isCollapsed ? styles.navItemCollapsed : ''}`, children: [_jsx("span", { className: styles.navItemIcon, children: item.icon }), !isCollapsed && (_jsxs(_Fragment, { children: [_jsx("span", { className: styles.navItemLabel, children: t(item.label) }), active && _jsx("span", { className: styles.navItemDot })] })), isCollapsed && active && _jsx("span", { className: styles.navItemDot })] }));
}
