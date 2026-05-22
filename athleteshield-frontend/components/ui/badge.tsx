import React from 'react';
import { cn } from '@/lib/utils/cn';

export type BadgeVariant = 
  | 'default'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'inactive'
  | 'expired'
  | 'revoked';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-full font-medium';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    revoked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <span
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';

export { Badge };
