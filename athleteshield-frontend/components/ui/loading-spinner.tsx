import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'white';
  centered?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  centered = false,
  className,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const variantClasses = {
    primary: 'text-blue-600 dark:text-blue-400',
    secondary: 'text-gray-600 dark:text-gray-400',
    white: 'text-white',
  };

  const spinner = (
    <Loader2
      className={cn('animate-spin', sizeClasses[size], variantClasses[variant], className)}
      aria-label="Loading"
      role="status"
    />
  );

  if (centered) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

LoadingSpinner.displayName = 'LoadingSpinner';

export { LoadingSpinner };
