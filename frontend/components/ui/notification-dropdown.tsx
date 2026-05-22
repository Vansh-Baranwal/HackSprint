'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { Bell, CheckCheck } from 'lucide-react';
import { NotificationBadge } from './notification-badge';
import type { Notification } from '@/types';

export interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  isLoading?: boolean;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  isOpen,
  onOpenChange,
  onMarkAsRead,
  onMarkAllAsRead,
  isLoading = false,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onOpenChange]);

  const getNotificationLink = (notification: Notification): string => {
    if (notification.metadata && typeof notification.metadata.link === 'string') {
      return notification.metadata.link;
    }
    return '/dashboard';
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        className="relative rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />
        <NotificationBadge count={unreadCount} className="absolute -right-1 -top-1" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
          role="menu"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  onMarkAllAsRead();
                }}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label="Mark all notifications as read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Bell className="mb-2 h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No notifications yet
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.slice(0, 20).map((notification) => (
                  <li key={notification.id}>
                    <Link
                      href={getNotificationLink(notification)}
                      onClick={() => {
                        if (notification.status !== 'READ') {
                          onMarkAsRead(notification.id);
                        }
                        onOpenChange(false);
                      }}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50',
                        notification.status !== 'READ'
                          ? 'bg-blue-50/50 dark:bg-blue-900/10'
                          : ''
                      )}
                      role="menuitem"
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-gray-900 dark:text-gray-100 truncate',
                            notification.status !== 'READ' ? 'font-medium' : ''
                          )}
                        >
                          {notification.subject}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                      {notification.status !== 'READ' && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
