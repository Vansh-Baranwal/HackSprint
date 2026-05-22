import { create } from 'zustand';
import type { Notification } from '@/types';
import { apiClient } from '@/lib/api/client';

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
      unreadCount: notification.status !== 'READ' ? state.unreadCount + 1 : state.unreadCount,
    }));
  },

  markAsRead: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      if (!notification || notification.status === 'READ') {
        return state;
      }

      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, status: 'READ' as const, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });

    // Update on server
    apiClient.patch(`/notifications/${id}/read`).catch(console.error);
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        status: 'READ' as const,
        readAt: n.readAt || new Date().toISOString(),
      })),
      unreadCount: 0,
    }));

    // Update on server
    apiClient.post('/notifications/mark-all-read').catch(console.error);
  },

  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount:
          notification && notification.status !== 'READ'
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
      };
    });
  },

  fetchNotifications: async () => {
    try {
      const notifications = await apiClient.get<Notification[]>('/notifications');
      set({
        notifications,
        unreadCount: notifications.filter((n) => n.status !== 'READ').length,
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  },

  setNotifications: (notifications) => {
    set({
      notifications,
      unreadCount: notifications.filter((n) => n.status !== 'READ').length,
    });
  },
}));
