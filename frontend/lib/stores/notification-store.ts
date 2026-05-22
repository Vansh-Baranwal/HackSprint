import { create } from 'zustand';
import type { Notification } from '@/types';
import { NotificationStatus } from '@/types';
import {
  fetchNotifications as apiFetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/api/notifications';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  fetchNotifications: () => Promise<void>;
  setNotifications: (notifications: Notification[]) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.status !== NotificationStatus.READ ? state.unreadCount + 1 : state.unreadCount,
    }));
  },

  markAsRead: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      if (!notification || notification.status === NotificationStatus.READ) {
        return state;
      }

      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, status: NotificationStatus.READ, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });

    // Persist read status to server
    markNotificationAsRead(id).catch(console.error);
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        status: NotificationStatus.READ,
        readAt: n.readAt || new Date().toISOString(),
      })),
      unreadCount: 0,
    }));

    // Persist to server
    markAllNotificationsAsRead().catch(console.error);
  },

  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount:
          notification && notification.status !== NotificationStatus.READ
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
      };
    });
  },

  fetchNotifications: async () => {
    try {
      const notifications = await apiFetchNotifications();
      set({
        notifications,
        unreadCount: notifications.filter((n) => n.status !== NotificationStatus.READ).length,
      });
    } catch {
      // Notifications endpoint may not exist on this backend — silently ignore
    }
  },

  setNotifications: (notifications) => {
    set({
      notifications,
      unreadCount: notifications.filter((n) => n.status !== NotificationStatus.READ).length,
    });
  },
}));
