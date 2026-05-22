import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface SkeletonLoaderProps {
  variant?: 'text' | 'image' | 'card' | 'circle';
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width,
  height,
  className,
  count = 1,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';

  const variantClasses = {
    text: 'h-4 rounded',
    image: 'aspect-video rounded-lg',
    card: 'h-48 rounded-lg',
    circle: 'rounded-full',
  };

  const variantStyles = {
    text: { height: height || '1rem' },
    image: { height: height || 'auto' },
    card: { height: height || '12rem' },
    circle: { height: height || '3rem', width: width || '3rem' },
  };

  const skeletonElement = (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={{
        width: width || (variant === 'circle' ? variantStyles[variant].width : '100%'),
        height: variantStyles[variant].height,
      }}
      aria-label="Loading"
      role="status"
    />
  );

  if (count === 1) {
    return skeletonElement;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{skeletonElement}</div>
      ))}
    </div>
  );
};

// Preset skeleton components for common use cases
export const SkeletonText: React.FC<Omit<SkeletonLoaderProps, 'variant'>> = (props) => (
  <SkeletonLoader variant="text" {...props} />
);

export const SkeletonImage: React.FC<Omit<SkeletonLoaderProps, 'variant'>> = (props) => (
  <SkeletonLoader variant="image" {...props} />
);

export const SkeletonCard: React.FC<Omit<SkeletonLoaderProps, 'variant'>> = (props) => (
  <SkeletonLoader variant="card" {...props} />
);

export const SkeletonCircle: React.FC<Omit<SkeletonLoaderProps, 'variant'>> = (props) => (
  <SkeletonLoader variant="circle" {...props} />
);

SkeletonLoader.displayName = 'SkeletonLoader';

export { SkeletonLoader };
