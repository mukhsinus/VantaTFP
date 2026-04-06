import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore, type Notification } from '@app/store/notifications.store';
import styles from './NotificationPanel.module.css';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

const typeIcons: Record<string, React.ReactNode> = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3.05h16.94a2 2 0 001.71-3.05L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

export function NotificationPanel({ isOpen, onClose, isMobile = false }: NotificationPanelProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const notifications = useNotificationStore((s: any) => s.notifications);
  const markAsRead = useNotificationStore((s: any) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s: any) => s.markAllAsRead);
  const removeNotification = useNotificationStore((s: any) => s.removeNotification);
  const unreadCount = useNotificationStore((s: any) => s.getUnreadCount());

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
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

  if (!isOpen) return null;

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleRemove = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    removeNotification(notificationId);
  };

  return (
    <div
      ref={panelRef}
      className={`${styles.panel} ${isMobile ? styles.panelMobile : styles.panelDesktop}`}
      role="dialog"
      aria-modal="true"
      aria-label={t('nav.notifications.title')}
    >
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>{t('nav.notifications.title')}</h2>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className={styles.markAllButton}>
            {t('common.notifications.markAllAsRead')}
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className={styles.content}>
        {notifications.length === 0 ? (
          <div className={styles.empty}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <p>{t('notifications.empty')}</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {notifications.map((notification: Notification) => (
              <li
                key={notification.id}
                className={`${styles.item} ${notification.read ? styles.itemRead : styles.itemUnread}`}
                onClick={() => handleNotificationClick(notification.id)}
                role="button"
                tabIndex={0}
              >
                <div className={`${styles.icon} ${styles[`icon${notification.type}`]}`}>
                  {typeIcons[notification.type]}
                </div>

                <div className={styles.content_}>
                  <div className={styles.itemHeader}>
                    <h3 className={styles.itemTitle}>{t(notification.title)}</h3>
                    {!notification.read && <span className={styles.unreadDot} />}
                  </div>
                  <p className={styles.itemMessage}>{t(notification.message)}</p>
                  <p className={styles.itemTime}>
                    {formatTime(notification.timestamp)}
                  </p>
                </div>

                <button
                  onClick={(e) => handleRemove(e, notification.id)}
                  className={styles.removeButton}
                  aria-label={t('common.delete')}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
