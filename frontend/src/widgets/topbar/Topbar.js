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
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { useUnreadNotifications } from '@features/notifications/hooks/useNotifications';
import styles from './Topbar.module.css';
const mobileSubtitleKeys = {
    '/dashboard': 'overview.subtitle',
    '/kpi': 'kpi.subtitle',
    '/payroll': 'payroll.subtitle',
    '/reports': 'reports.subtitle',
    '/billing': 'billing.subtitle',
    '/settings': 'settings.subtitle',
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
    const { role } = useCurrentUser();
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const toggleSidebar = useSidebarStore((s) => s.toggleCollapsed);
    const isMobile = useIsMobile();
    const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const unread = useUnreadNotifications();
    const baseRoute = '/' + location.pathname.split('/')[1];
    const titleByRoute = {
        '/dashboard': role === 'MANAGER' ? 'Team Dashboard' : 'Dashboard',
        '/tasks': role === 'EMPLOYEE' ? 'My Tasks' : role === 'MANAGER' ? 'Team Tasks' : 'Tasks',
        '/employees': 'Employees',
        '/kpi': role === 'EMPLOYEE' ? 'My KPI' : role === 'MANAGER' ? 'Team KPI' : 'KPI',
        '/payroll': role === 'EMPLOYEE' ? 'My Payroll' : 'Payroll',
        '/reports': 'Reports',
        '/billing': 'Billing',
        '/settings': 'Settings',
    };
    const title = titleByRoute[baseRoute] ?? 'Dashboard';
    const subtitleKey = mobileSubtitleKeys[baseRoute];
    const fullName = user ? `${user.firstName} ${user.lastName}` : '';
    useEffect(() => {
        setIsAccountSheetOpen(false);
        setIsNotificationsOpen(false);
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
    useEffect(() => {
        if (!isNotificationsOpen)
            return;
        const onClick = (event) => {
            const target = event.target;
            if (target?.closest('[data-notification-panel]'))
                return;
            setIsNotificationsOpen(false);
        };
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, [isNotificationsOpen]);
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
    return (_jsxs("header", { className: `${styles.header} ${isMobile ? styles.headerMobile : styles.headerDesktop}`, children: [!isMobile && (_jsx("button", { onClick: toggleSidebar, title: t('sidebar.toggle') ?? t('nav.actions.toggleSidebar'), className: styles.toggleButton, children: _jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [_jsx("line", { x1: "3", y1: "6", x2: "21", y2: "6" }), _jsx("line", { x1: "3", y1: "12", x2: "21", y2: "12" }), _jsx("line", { x1: "3", y1: "18", x2: "21", y2: "18" })] }) })), isMobile ? (_jsxs("div", { className: styles.mobileTitleWrap, children: [_jsx("h1", { className: `${styles.title} ${styles.titleMobile}`, children: title }), subtitleKey && _jsx("p", { className: styles.mobileSubtitle, children: t(subtitleKey) })] })) : (_jsx("h1", { className: styles.title, children: title })), _jsxs("div", { className: `${styles.actions} ${isMobile ? styles.actionsMobile : ''}`, children: [!isMobile && _jsx(LanguageSwitcher, {}), !isMobile && _jsx("div", { className: styles.divider }), user && (_jsxs("div", { style: { position: 'relative' }, "data-notification-panel": true, children: [_jsxs("button", { onClick: () => setIsNotificationsOpen((v) => !v), style: {
                                    position: 'relative',
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg)',
                                    cursor: 'pointer',
                                }, children: [_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [_jsx("path", { d: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" }), _jsx("path", { d: "M13.73 21a2 2 0 01-3.46 0" })] }), (unread.data?.length ?? 0) > 0 && (_jsx("span", { style: {
                                            position: 'absolute',
                                            top: 2,
                                            right: 2,
                                            minWidth: 16,
                                            height: 16,
                                            borderRadius: 999,
                                            background: 'var(--color-danger)',
                                            color: '#fff',
                                            fontSize: 10,
                                            lineHeight: '16px',
                                            textAlign: 'center',
                                            padding: '0 4px',
                                        }, children: Math.min(unread.data?.length ?? 0, 99) }))] }), isNotificationsOpen && (_jsxs("div", { style: {
                                    position: 'absolute',
                                    right: 0,
                                    top: 42,
                                    width: 320,
                                    maxHeight: 360,
                                    overflowY: 'auto',
                                    background: 'var(--color-bg)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-lg)',
                                    boxShadow: 'var(--shadow-lg)',
                                    padding: 10,
                                    zIndex: 30,
                                }, children: [_jsx("p", { style: { margin: '0 0 8px', fontWeight: 600, fontSize: 'var(--text-sm)' }, children: "Notifications" }), !unread.data?.length ? (_jsx("p", { style: { margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }, children: "No unread notifications." })) : (unread.data.map((item) => (_jsxs("div", { style: { borderTop: '1px solid var(--color-border)', padding: '8px 0' }, children: [_jsx("p", { style: { margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600 }, children: item.title }), _jsx("p", { style: { margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }, children: item.message })] }, item.id))))] }))] })), user && (_jsxs("div", { className: styles.userSection, children: [isMobile ? (_jsx("button", { onClick: () => setIsAccountSheetOpen(true), "aria-label": t('nav.account.openMenu'), className: styles.userButtonMobile, children: _jsx(Avatar, { name: fullName, size: "sm" }) })) : (_jsx(Avatar, { name: fullName, size: "sm" })), !isMobile && (_jsxs("div", { className: styles.userInfo, children: [_jsxs("h2", { className: styles.userName, children: [user.firstName, " ", user.lastName] }), _jsx("div", { className: styles.userBadge, children: _jsx(Badge, { variant: roleVariant[user.role] ?? 'default', children: user.role === 'ADMIN'
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
                                borderTopLeftRadius: 20,
                                borderTopRightRadius: 20,
                                borderTop: '1px solid var(--color-border)',
                                boxShadow: '0 -12px 32px rgba(0,0,0,0.16)',
                                padding: '12px 16px calc(20px + env(safe-area-inset-bottom))',
                            }, children: [_jsx("div", { className: styles.sheetHandle }), _jsxs("div", { className: styles.sheetSection, children: [_jsx("p", { className: styles.sheetSectionTitle, children: t('settings.profile.title') }), _jsxs("div", { className: styles.sheetUserSection, children: [_jsx(Avatar, { name: fullName, size: "md" }), _jsxs("div", { className: styles.sheetUserInfo, children: [_jsx("p", { className: styles.sheetUserName, children: fullName }), _jsx("div", { className: styles.sheetUserBadge, children: _jsx(Badge, { variant: roleVariant[user.role] ?? 'default', children: user.role === 'ADMIN'
                                                                    ? t('profile.roles.admin')
                                                                    : user.role === 'MANAGER'
                                                                        ? t('profile.roles.manager')
                                                                        : t('profile.roles.employee') }) })] })] })] }), _jsxs("div", { className: styles.sheetSection, children: [_jsx("p", { className: styles.sheetSectionTitle, children: t('common.languageSwitcher') }), _jsx("div", { className: styles.sheetLanguage, children: _jsx(LanguageSwitcher, { fullWidth: true }) })] }), _jsxs("div", { className: styles.sheetSection, children: [_jsx("p", { className: styles.sheetSectionTitle, children: t('nav.account.actionsTitle') }), _jsxs("div", { className: styles.sheetActions, children: [_jsx("button", { onClick: goToSettings, className: styles.sheetActionButton, children: t('nav.labels.settings') }), _jsx("button", { onClick: handleLogout, className: `${styles.sheetActionButton} ${styles.sheetActionButtonDanger}`, children: t('nav.labels.logout') })] })] })] })] }), document.body)] }));
}
