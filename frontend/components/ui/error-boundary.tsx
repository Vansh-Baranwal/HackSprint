'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ErrorBoundaryProps {
  /** Content to render when no error has occurred */
  children: ReactNode;
  /** Optional custom fallback UI. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Optional class name applied to the default fallback container */
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ─── ErrorBoundary class component ───────────────────────────────────────────

/**
 * React Error Boundary that catches errors thrown anywhere in its child tree.
 *
 * - Displays a friendly fallback UI with the error message and a Reload button.
 * - Logs errors to the console in development (`process.env.NODE_ENV === 'development'`).
 * - Prevents the entire application from crashing due to a single component error.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <SomeComponent />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.reset = this.reset.bind(this);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Caught an error:', error);
      console.error('[ErrorBoundary] Component stack:', info.componentStack);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Resets the error state so the child tree is re-rendered. */
  reset(): void {
    this.setState({ hasError: false, error: null });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, className } = this.props;

    if (!hasError || !error) {
      return children;
    }

    // Use the custom fallback if provided
    if (fallback) {
      return fallback(error, this.reset);
    }

    // Default fallback UI
    return (
      <DefaultFallback
        error={error}
        onReset={this.reset}
        className={className}
      />
    );
  }
}

ErrorBoundary.displayName = 'ErrorBoundary';

// ─── Default fallback UI ──────────────────────────────────────────────────────

interface DefaultFallbackProps {
  error: Error;
  onReset: () => void;
  className?: string;
}

function DefaultFallback({ error, onReset, className }: DefaultFallbackProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950',
        className
      )}
    >
      {/* Icon */}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
        <svg
          className="h-6 w-6 text-red-600 dark:text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>

      {/* Heading */}
      <h2 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-200">
        Something went wrong
      </h2>

      {/* Error message */}
      <p className="mb-6 max-w-md text-sm text-red-600 dark:text-red-400">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>

      {/* Reload button */}
      <button
        type="button"
        onClick={onReset}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
          'bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
          'dark:bg-red-700 dark:hover:bg-red-600 dark:focus:ring-offset-red-950'
        )}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
        Reload
      </button>
    </div>
  );
}

// ─── withErrorBoundary HOC ────────────────────────────────────────────────────

/**
 * Higher-order component that wraps a component with an ErrorBoundary.
 *
 * Usage:
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent);
 * // or with options:
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   fallback: (error, reset) => <CustomFallback error={error} onReset={reset} />,
 * });
 * ```
 */
function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export { ErrorBoundary, withErrorBoundary };
export type { ErrorBoundaryState };
