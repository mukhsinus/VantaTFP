import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@widgets/sidebar/Sidebar';
import { Topbar } from '@widgets/topbar/Topbar';
import { MobileBottomTabs } from '@widgets/mobile-bottom-tabs/MobileBottomTabs';
import { ToastRenderer } from '@shared/components/Toast';
import { Skeleton } from '@shared/components/ui';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useSidebarStore } from '@app/store/sidebar.store';
import { useAuthStore } from '@app/store/auth.store';
import { useNotificationsRealtime } from '@features/notifications/hooks/useNotifications';
import styles from './AppLayout.module.css';
export function AppLayout() {
    const isMobile = useIsMobile();
    const isCollapsed = useSidebarStore((s) => s.isCollapsed);
    const user = useAuthStore((s) => s.user);
    useNotificationsRealtime();
    const sidebarWidth = !isMobile && isCollapsed ? 64 : !isMobile ? 224 : 0;
    return (_jsxs("div", { className: styles.container, children: [!isMobile && _jsx(Sidebar, {}), _jsxs("div", { className: styles.mainWrapper, style: {
                    marginLeft: sidebarWidth,
                }, children: [_jsx(Topbar, {}), _jsx("main", { className: styles.mainContent, children: _jsx("div", { className: "page-container", children: !user ? (_jsx(Skeleton, { height: 200, borderRadius: "var(--radius-lg)" })) : (_jsx(Outlet, {})) }) })] }), isMobile && _jsx(MobileBottomTabs, {}), _jsx(ToastRenderer, {})] }));
}
