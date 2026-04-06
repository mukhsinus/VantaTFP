import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '@app/store/notifications.store';
import styles from './NotificationPanel.module.css';
const typeIcons = {
    success: (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: _jsx("polyline", { points: "20 6 9 17 4 12" }) })),
    error: (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("line", { x1: "15", y1: "9", x2: "9", y2: "15" }), _jsx("line", { x1: "9", y1: "9", x2: "15", y2: "15" })] })),
    warning: (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [_jsx("path", { d: "M10.29 3.86L1.82 18a2 2 0 001.71 3.05h16.94a2 2 0 001.71-3.05L13.71 3.86a2 2 0 00-3.42 0z" }), _jsx("line", { x1: "12", y1: "9", x2: "12", y2: "13" }), _jsx("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })] })),
    info: (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("line", { x1: "12", y1: "16", x2: "12", y2: "12" }), _jsx("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" })] })),
};
export function NotificationPanel({ isOpen, onClose, isMobile = false }) {
    const { t } = useTranslation();
    const panelRef = useRef(null);
    const notifications = useNotificationStore((s) => s.notifications);
    const markAsRead = useNotificationStore((s) => s.markAsRead);
    const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
    const removeNotification = useNotificationStore((s) => s.removeNotification);
    const unreadCount = useNotificationStore((s) => s.getUnreadCount());
    useEffect(() => {
        if (!isOpen)
            return;
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                onClose();
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    const handleNotificationClick = (notificationId) => {
        markAsRead(notificationId);
    };
    const handleRemove = (e, notificationId) => {
        e.stopPropagation();
        removeNotification(notificationId);
    };
    return (_jsxs("div", { ref: panelRef, className: `${styles.panel} ${isMobile ? styles.panelMobile : styles.panelDesktop}`, role: "dialog", "aria-modal": "true", "aria-label": t('nav.notifications.title'), children: [_jsxs("div", { className: styles.header, children: [_jsx("h2", { className: styles.title, children: t('nav.notifications.title') }), unreadCount > 0 && (_jsx("button", { onClick: markAllAsRead, className: styles.markAllButton, children: t('notifications.markAllAsRead') }))] }), _jsx("div", { className: styles.content, children: notifications.length === 0 ? (_jsxs("div", { className: styles.empty, children: [_jsx("svg", { width: "32", height: "32", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, children: _jsx("path", { d: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" }) }), _jsx("p", { children: t('notifications.empty') })] })) : (_jsx("ul", { className: styles.list, children: notifications.map((notification) => (_jsxs("li", { className: `${styles.item} ${notification.read ? styles.itemRead : styles.itemUnread}`, onClick: () => handleNotificationClick(notification.id), role: "button", tabIndex: 0, children: [_jsx("div", { className: `${styles.icon} ${styles[`icon${notification.type}`]}`, children: typeIcons[notification.type] }), _jsxs("div", { className: styles.content_, children: [_jsxs("div", { className: styles.itemHeader, children: [_jsx("h3", { className: styles.itemTitle, children: notification.title }), !notification.read && _jsx("span", { className: styles.unreadDot })] }), _jsx("p", { className: styles.itemMessage, children: notification.message }), _jsx("p", { className: styles.itemTime, children: formatTime(notification.timestamp) })] }), _jsx("button", { onClick: (e) => handleRemove(e, notification.id), className: styles.removeButton, "aria-label": t('common.delete'), children: "\u2715" })] }, notification.id))) })) })] }));
}
function formatTime(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1)
        return 'just now';
    if (diffMins < 60)
        return `${diffMins}m ago`;
    if (diffHours < 24)
        return `${diffHours}h ago`;
    if (diffDays < 7)
        return `${diffDays}d ago`;
    return date.toLocaleDateString();
}
