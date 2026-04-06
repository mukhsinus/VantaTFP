import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './MobileBottomTabs.module.css';
const tabs = [
    {
        to: '/dashboard',
        labelKey: 'nav.overview',
        icon: (_jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, children: [_jsx("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" })] })),
    },
    {
        to: '/tasks',
        labelKey: 'nav.tasks',
        icon: (_jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, children: [_jsx("path", { d: "M9 11l3 3L22 4" }), _jsx("path", { d: "M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" })] })),
    },
    {
        to: '/employees',
        labelKey: 'nav.employees',
        icon: (_jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, children: [_jsx("path", { d: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" }), _jsx("circle", { cx: "9", cy: "7", r: "4" }), _jsx("path", { d: "M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" })] })),
    },
    {
        to: '/kpi',
        labelKey: 'nav.kpi',
        icon: (_jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, children: _jsx("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" }) })),
    },
    {
        to: '/payroll',
        labelKey: 'nav.payroll',
        icon: (_jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, children: [_jsx("rect", { x: "2", y: "5", width: "20", height: "14", rx: "2" }), _jsx("path", { d: "M2 10h20" }), _jsx("path", { d: "M12 15h.01" })] })),
    },
];
export function MobileBottomTabs() {
    const { t } = useTranslation();
    const location = useLocation();
    return (_jsx("nav", { className: styles.nav, children: tabs.map((tab) => {
            const active = location.pathname.startsWith(tab.to);
            return (_jsxs(NavLink, { to: tab.to, className: `${styles.tab} ${active ? styles.tabActive : ''}`, children: [tab.icon, _jsx("span", { children: t(tab.labelKey) })] }, tab.to));
        }) }));
}
