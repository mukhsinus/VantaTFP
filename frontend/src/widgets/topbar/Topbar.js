import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Badge } from '@shared/components/ui';
import { LanguageSwitcher } from '@shared/components/language-switcher/LanguageSwitcher';
import { useAuthStore } from '@app/store/auth.store';
import { useSidebarStore } from '@app/store/sidebar.store';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import styles from './Topbar.module.css';
const pageTitles = {
    '/dashboard': 'nav.overview',
    '/tasks': 'nav.tasks',
    '/employees': 'nav.employees',
    '/kpi': 'nav.kpi',
    '/payroll': 'nav.payroll',
    '/settings': 'nav.settings',
};
const roleVariant = {
    ADMIN: 'danger',
    MANAGER: 'warning',
    EMPLOYEE: 'success',
};
export function Topbar() {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const toggleSidebar = useSidebarStore((s) => s.toggleCollapsed);
    const isMobile = useIsMobile();
    const [search, setSearch] = useState('');
    const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);
    const baseRoute = '/' + location.pathname.split('/')[1];
    const titleKey = pageTitles[baseRoute] ?? 'nav.overview';
    const fullName = user ? `${user.firstName} ${user.lastName}` : '';
    useEffect(() => {
        setIsAccountSheetOpen(false);
    }, [location.pathname, location.search]);
    useEffect(() => {
        if (!isAccountSheetOpen)
            return;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsAccountSheetOpen(false);
            }
        };
        document.addEventListener('keydown', onKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = '';
        };
    }, [isAccountSheetOpen]);
    const closeAccountSheet = () => setIsAccountSheetOpen(false);
    const goToSettings = () => {
        closeAccountSheet();
        navigate('/settings');
    };
    const handleLogout = () => {
        closeAccountSheet();
        clearAuth();
        navigate('/login', { replace: true });
    };
    return (_jsxs("header", { className: `${styles.header} ${isMobile ? styles.headerMobile : styles.headerDesktop}`, children: [!isMobile && (_jsx("button", { onClick: toggleSidebar, title: t('sidebar.toggle') ?? t('nav.actions.toggleSidebar'), className: styles.toggleButton, children: _jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [_jsx("line", { x1: "3", y1: "6", x2: "21", y2: "6" }), _jsx("line", { x1: "3", y1: "12", x2: "21", y2: "12" }), _jsx("line", { x1: "3", y1: "18", x2: "21", y2: "18" })] }) })), _jsx("h1", { className: styles.title, children: t(titleKey) }), !isMobile && (_jsx("div", { className: styles.searchContainer, children: _jsxs("div", { className: styles.searchWrapper, children: [_jsx("span", { className: styles.searchIcon, children: _jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [_jsx("circle", { cx: "11", cy: "11", r: "8" }), _jsx("path", { d: "M21 21l-4.35-4.35" })] }) }), _jsx("input", { type: "search", placeholder: t('topbar.search'), value: search, onChange: (e) => setSearch(e.target.value), className: styles.searchInput }), _jsx("kbd", { className: styles.searchShortcut, children: t('topbar.shortcut') })] }) })), _jsxs("div", { className: `${styles.actions} ${isMobile ? styles.actionsMobile : ''}`, children: [!isMobile && _jsx(LanguageSwitcher, {}), !isMobile && (_jsxs("button", { className: styles.notificationButton, "aria-label": t('nav.notifications.title'), children: [_jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, children: _jsx("path", { d: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" }) }), _jsx("span", { className: styles.notificationDot })] })), !isMobile && _jsx("div", { className: styles.divider }), user && (_jsxs("div", { className: styles.userSection, children: [isMobile ? (_jsx("button", { onClick: () => setIsAccountSheetOpen(true), "aria-label": t('nav.account.openMenu'), className: styles.userButtonMobile, children: _jsx(Avatar, { name: fullName, size: "sm" }) })) : (_jsx(Avatar, { name: fullName, size: "sm" })), !isMobile && (_jsxs("div", { className: styles.userInfo, children: [_jsxs("h2", { className: styles.userName, children: [user.firstName, " ", user.lastName] }), _jsx("div", { className: styles.userBadge, children: _jsx(Badge, { variant: roleVariant[user.role] ?? 'default', children: user.role === 'ADMIN'
                                                ? t('profile.roles.admin')
                                                : user.role === 'MANAGER'
                                                    ? t('profile.roles.manager')
                                                    : t('profile.roles.employee') }) })] }))] }))] }), isMobile && user && isAccountSheetOpen &&
                createPortal(_jsxs("div", { className: styles.mobileSheet, children: [_jsx("button", { onClick: closeAccountSheet, "aria-label": t('nav.account.closeSheet'), className: styles.sheetBackdrop }), _jsxs("div", { role: "dialog", "aria-modal": "true", "aria-label": t('nav.account.actionsTitle'), className: styles.sheetContent, style: {
                                position: 'relative',
                                width: '100%',
                                maxWidth: '100%',
                                boxSizing: 'border-box',
                                background: 'var(--color-bg)',
                                borderTopLeftRadius: 18,
                                borderTopRightRadius: 18,
                                borderTop: '1px solid var(--color-border)',
                                boxShadow: '0 -8px 24px rgba(0,0,0,0.12)',
                                padding: '12px 14px calc(16px + env(safe-area-inset-bottom))',
                            }, children: [_jsx("div", { className: styles.sheetHandle }), _jsxs("div", { className: styles.sheetUserSection, children: [_jsx(Avatar, { name: fullName, size: "md" }), _jsxs("div", { className: styles.sheetUserInfo, children: [_jsx("p", { className: styles.sheetUserName, children: fullName }), _jsx("div", { className: styles.sheetUserBadge, children: _jsx(Badge, { variant: roleVariant[user.role] ?? 'default', children: user.role === 'ADMIN'
                                                            ? t('profile.roles.admin')
                                                            : user.role === 'MANAGER'
                                                                ? t('profile.roles.manager')
                                                                : t('profile.roles.employee') }) })] })] }), _jsxs("div", { className: styles.sheetActions, children: [_jsx("div", { className: styles.sheetLanguage, children: _jsx(LanguageSwitcher, { fullWidth: true }) }), _jsx("button", { onClick: goToSettings, className: styles.sheetActionButton, children: t('nav.labels.settings') }), _jsx("button", { onClick: handleLogout, className: `${styles.sheetActionButton} ${styles.sheetActionButtonDanger}`, children: t('nav.labels.logout') })] })] })] }), document.body)] }));
}
