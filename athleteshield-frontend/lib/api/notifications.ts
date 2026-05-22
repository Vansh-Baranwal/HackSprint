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
  try {
    // Try paginated endpoint first; fall back to plain array if backend returns one
    const response = await apiClient.get<PaginatedResponse<Notification> | Notification[]>(
      '/notifications',
      { params }
    );

    // Handle both paginated and plain array responses
    if (Array.isArray(response)) {
      return response;
    }
    return (response as PaginatedResponse<Notification>).data;
  } catch (error) {
    throw error;
  }
}

/**
 * Mark a single notification as read.
 * Requirement 20.5
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  await apiClient.patch<void>(`/notifications/${id}/read`);
}

/**
 * Mark all notifications as read for the authenticated user.
 * Requirement 20.5
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.post<void>('/notifications/mark-all-read');
}
