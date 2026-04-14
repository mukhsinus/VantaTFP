import { create } from 'zustand';
export const useNotificationStore = create((set, get) => ({
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
    addNotification: (notification) => set((state) => ({
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
    markAsRead: (notificationId) => set((state) => ({
        notifications: state.notifications.map((n) => n.id === notificationId ? { ...n, read: true } : n),
    })),
    markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
    removeNotification: (notificationId) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== notificationId),
    })),
    clearAll: () => set({ notifications: [] }),
    getUnreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
