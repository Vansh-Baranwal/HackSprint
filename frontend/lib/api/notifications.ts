import { apiClient } from '@/lib/api/client';
import type { Notification, PaginatedResponse } from '@/types';

export interface FetchNotificationsParams {
  page?: number;
  pageSize?: number;
  status?: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
}

/**
 * Fetch notifications for the authenticated user.
 * Requirement 20.1, 20.2, 20.3, 20.6
 */
export async function fetchNotifications(
  params?: FetchNotificationsParams
): Promise<Notification[]> {
  // Silence network console logs: return an empty list immediately since the backend does not implement notification endpoints
  return [];
}

/**
 * Mark a single notification as read.
 * Requirement 20.5
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  // No-op since backend does not support notifications
}

/**
 * Mark all notifications as read for the authenticated user.
 * Requirement 20.5
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  // No-op since backend does not support notifications
}
