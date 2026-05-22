import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className, hover = false }) => {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800',
        hover && 'transition-shadow hover:shadow-md',
        className
      )}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'border-b border-gray-200 px-6 py-4 dark:border-gray-700',
        className
      )}
    >
      {children}
    </div>
  );
};

export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

const CardTitle: React.FC<CardTitleProps> = ({ children, className }) => {
  return (
    <h3
      className={cn(
        'text-lg font-semibold text-gray-900 dark:text-gray-100',
        className
      )}
    >
      {children}
    </h3>
  );
};

export interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const CardDescription: React.FC<CardDescriptionProps> = ({ children, className }) => {
  return (
    <p
      className={cn(
        'mt-1 text-sm text-gray-500 dark:text-gray-400',
        className
      )}
    >
      {children}
    </p>
  );
};

export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

const CardBody: React.FC<CardBodyProps> = ({ children, className }) => {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
};

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'border-t border-gray-200 px-6 py-4 dark:border-gray-700',
        className
      )}
    >
      {children}
    </div>
  );
};

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';
CardBody.displayName = 'CardBody';
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter };
