'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from './navigation';
import { useToast } from '@/components/ui/toast';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { AICoachChat } from '@/components/features/ai-coach-chat';
import type { User } from '@/types';
import { UserRole } from '@/types';

export interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

const POLL_INTERVAL = 30000;

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { ToastContainer, error: showError } = useToast();
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } =
    useNotificationStore();

  // Read user from localStorage
  const [user, setUser] = React.useState<User | null>(null);
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');
      if (storedUser && accessToken) {
        setUser(JSON.parse(storedUser));
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    }
    setIsReady(true);
  }, [router]);

  useEffect(() => {
    if (!user) return;

    // Silently try to fetch notifications, ignore errors since endpoint may not exist
    try {
      fetchNotifications();
    } catch {}

    const interval = setInterval(() => {
      try {
        fetchNotifications();
      } catch {}
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('auth-storage');
      // Clear the cookie so middleware redirects properly
      document.cookie = 'Access_Token=; path=/; max-age=0';
      router.push('/login');
    } catch {
      showError('Logout failed. Please try again.');
    }
  };

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-black text-white selection:bg-orange-500/30">
      {/* Athlete Dashboard Background Image */}
      {user.roles?.includes(UserRole.ATHLETE) && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25" 
          style={{ backgroundImage: "url('/dashboard.jpg')" }} 
        />
      )}

      {/* Background Gradient Mesh */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-orange-600/10 mix-blend-screen blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-red-600/10 mix-blend-screen blur-[120px]" />
      </div>

      <div className="relative z-10 flex h-full w-full flex-col lg:flex-row">
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
      </div>

      {/* Conditionally render AI Coach Chat for Athletes */}
      {user.roles?.includes(UserRole.ATHLETE) && (
        <AICoachChat sport={(user as any).primarySport || 'Athletics'} />
      )}

      <ToastContainer />
    </div>
  );
};
