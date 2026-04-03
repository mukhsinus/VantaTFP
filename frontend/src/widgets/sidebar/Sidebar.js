import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@shared/components/ui';
import { useAuthStore } from '@app/store/auth.store';
const navItems = [
    {
        to: '/dashboard',
        labelKey: 'nav.dashboard',
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
    const handleLogout = () => {
        clearAuth();
        navigate('/login', { replace: true });
    };
    return (_jsxs("nav", { style: {
            width: 'var(--sidebar-width)',
            minWidth: 'var(--sidebar-width)',
            height: '100vh',
            background: 'var(--sidebar-bg)',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 'var(--z-sidebar)',
            overflowY: 'auto',
        }, children: [_jsx("div", { style: {
                    padding: '20px 16px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10 }, children: [_jsx("div", { style: {
                                width: 28,
                                height: 28,
                                borderRadius: 'var(--radius)',
                                background: 'var(--color-accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }, children: _jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: 2.5, children: _jsx("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" }) }) }), _jsxs("div", { children: [_jsx("p", { style: { fontSize: 'var(--text-sm)', fontWeight: 700, color: '#fff', lineHeight: 1.2 }, children: "TFP" }), _jsx("p", { style: {
                                        fontSize: 'var(--text-xs)',
                                        color: 'rgba(255,255,255,0.35)',
                                        lineHeight: 1.2,
                                    }, children: user?.tenantName ?? 'Workspace' })] })] }) }), _jsxs("div", { style: { flex: 1, padding: '8px 8px' }, children: [_jsx("p", { style: {
                            fontSize: 10,
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.25)',
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            padding: '8px 8px 4px',
                            marginBottom: 2,
                        }, children: t('nav.section.main') }), navItems.map((item) => (_jsx(SidebarItem, { item: item, active: location.pathname.startsWith(item.to) }, item.to)))] }), user && (_jsx("div", { style: {
                    padding: '12px 8px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                }, children: _jsxs("div", { style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px',
                        borderRadius: 'var(--radius)',
                    }, children: [_jsx(Avatar, { name: `${user.firstName} ${user.lastName}`, size: "sm" }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsxs("p", { style: {
                                        fontSize: 'var(--text-sm)',
                                        fontWeight: 500,
                                        color: '#fff',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }, children: [user.firstName, " ", user.lastName] }), _jsx("p", { style: {
                                        fontSize: 'var(--text-xs)',
                                        color: 'rgba(255,255,255,0.4)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }, children: user.role })] }), _jsx("button", { onClick: handleLogout, title: t('nav.logout'), style: {
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(255,255,255,0.3)',
                                cursor: 'pointer',
                                padding: 4,
                                borderRadius: 'var(--radius-sm)',
                                display: 'flex',
                                transition: 'color var(--transition)',
                                flexShrink: 0,
                            }, onMouseEnter: (e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)'), onMouseLeave: (e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)'), children: _jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { d: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" }) }) })] }) }))] }));
}
function SidebarItem({ item, active }) {
    const { t } = useTranslation();
    return (_jsxs(NavLink, { to: item.to, style: {
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 8px',
            borderRadius: 'var(--radius)',
            color: active ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
            background: active ? 'var(--sidebar-item-active)' : 'transparent',
            textDecoration: 'none',
            fontSize: 'var(--text-sm)',
            fontWeight: active ? 500 : 400,
            transition: 'background var(--transition), color var(--transition)',
            marginBottom: 2,
        }, onMouseEnter: (e) => {
            if (!active) {
                e.currentTarget.style.background = 'var(--sidebar-item-hover)';
                e.currentTarget.style.color = '#fff';
            }
        }, onMouseLeave: (e) => {
            if (!active) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--sidebar-text)';
            }
        }, children: [_jsx("span", { style: { opacity: active ? 1 : 0.6, flexShrink: 0 }, children: item.icon }), t(item.labelKey), active && (_jsx("span", { style: {
                    marginLeft: 'auto',
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: 'var(--color-accent)',
                    flexShrink: 0,
                } }))] }));
}
