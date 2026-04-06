import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>((set: any, get: any) => ({
  notifications: [
    {
      id: '1',
      type: 'info',
      title: 'common.notifications.welcome.title',
      message: 'common.notifications.welcome.message',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      read: false,
    },
    {
      id: '2',
      type: 'success',
      title: 'common.notifications.taskCompleted.title',
      message: 'common.notifications.taskCompleted.message',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: false,
    },
  ],

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) =>
    set((state: NotificationStore) => ({
      notifications: [
        {
          ...notification,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
          read: false,
        },
        ...state.notifications,
      ],
    })),

  markAsRead: (notificationId: string) =>
    set((state: NotificationStore) => ({
      notifications: state.notifications.map((n: Notification) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    })),

  markAllAsRead: () =>
    set((state: NotificationStore) => ({
      notifications: state.notifications.map((n: Notification) => ({ ...n, read: true })),
    })),

  removeNotification: (notificationId: string) =>
    set((state: NotificationStore) => ({
      notifications: state.notifications.filter((n: Notification) => n.id !== notificationId),
    })),

  clearAll: () => set({ notifications: [] }),

  getUnreadCount: () => get().notifications.filter((n: Notification) => !n.read).length,
}));
