import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@shared/components/ui';
import { useAuthStore } from '@app/store/auth.store';
import { useSidebarStore } from '@app/store/sidebar.store';
import styles from './Sidebar.module.css';
const navItems = [
    {
        to: '/dashboard',
        labelKey: 'nav.overview',
        icon: (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, children: [_jsx("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" })] })),
    },
    {
        to: '/tasks',
        labelKey: 'nav.tasks',
        icon: (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, children: [_jsx("path", { d: "M9 11l3 3L22 4" }), _jsx("path", { d: "M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" })] })),
    },
    {
        to: '/employees',
        labelKey: 'nav.employees',
        icon: (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, children: [_jsx("path", { d: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" }), _jsx("circle", { cx: "9", cy: "7", r: "4" }), _jsx("path", { d: "M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" })] })),
    },
    {
        to: '/kpi',
        labelKey: 'nav.kpi',
        icon: (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, children: _jsx("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" }) })),
    },
    {
        to: '/payroll',
        labelKey: 'nav.payroll',
        icon: (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, children: [_jsx("rect", { x: "2", y: "5", width: "20", height: "14", rx: "2" }), _jsx("path", { d: "M2 10h20" }), _jsx("path", { d: "M12 15h.01" })] })),
    },
    {
        to: '/settings',
        labelKey: 'nav.settings',
        icon: (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, children: [_jsx("circle", { cx: "12", cy: "12", r: "3" }), _jsx("path", { d: "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" })] })),
    },
];
export function Sidebar() {
    const { t } = useTranslation();
    const user = useAuthStore((s) => s.user);
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const location = useLocation();
    const navigate = useNavigate();
    const isCollapsed = useSidebarStore((s) => s.isCollapsed);
    const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
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
    return (_jsxs(NavLink, { to: item.to, title: isCollapsed ? t(item.labelKey) : undefined, className: `${styles.navItem} ${active ? styles.navItemActive : ''} ${isCollapsed ? styles.navItemCollapsed : ''}`, children: [_jsx("span", { className: styles.navItemIcon, children: item.icon }), !isCollapsed && (_jsxs(_Fragment, { children: [_jsx("span", { className: styles.navItemLabel, children: t(item.labelKey) }), active && _jsx("span", { className: styles.navItemDot })] })), isCollapsed && active && _jsx("span", { className: styles.navItemDot })] }));
}
