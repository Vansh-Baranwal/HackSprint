'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from './navigation';
import { useToast } from '@/components/ui/toast';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { apiClient } from '@/lib/api/client';
import type { User } from '@/types';

export interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

const POLL_INTERVAL = 30000;

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { ToastContainer, error: showError } = useToast();
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } =
    useNotificationStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await apiClient.get<User>('/auth/me');
        setUser(userData);
      } catch {
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
      router.push('/login');
    } catch {
      showError('Logout failed. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Navigation
        userRoles={user.roles}
        userName={`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
        userEmail={user.email}
        notificationCount={unreadCount}
        isNotificationOpen={isNotificationOpen}
        onNotificationOpenChange={setIsNotificationOpen}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 lg:px-8">
          {children}
        </div>
      </main>

      <ToastContainer />
    </div>
  );
};
