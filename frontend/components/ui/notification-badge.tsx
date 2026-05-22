'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface NotificationBadgeProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  size = 'md',
  className,
}) => {
  if (count <= 0) return null;

  const sizeClasses = {
    sm: 'h-4 min-w-[16px] text-[10px] px-1',
    md: 'h-5 min-w-[20px] text-xs px-1.5',
    lg: 'h-6 min-w-[24px] text-sm px-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-red-600 font-medium text-white',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={`${count} unread notifications`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};
