import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils/cn';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

export interface ToastProps extends Toast {
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = ({ id, message, variant, duration = 3000, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onClose(id), 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  };

  const variantStyles = {
    success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5 flex-shrink-0" />,
    error: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 flex-shrink-0" />,
    info: <Info className="h-5 w-5 flex-shrink-0" />,
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300',
        variantStyles[variant],
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      )}
      role="alert"
      aria-live="polite"
    >
      {icons[variant]}
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={handleClose}
        className="rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/5"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  const container = (
    <div
      className="pointer-events-none fixed right-0 top-0 z-50 flex max-h-screen w-full flex-col items-end gap-2 p-4 sm:max-w-md"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );

  return createPortal(container, document.body);
};

// Toast hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, variant: ToastVariant = 'info', duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, variant, duration };
    setToasts((prev) => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const success = (message: string, duration?: number) => addToast(message, 'success', duration);
  const error = (message: string, duration?: number) => addToast(message, 'error', duration);
  const warning = (message: string, duration?: number) => addToast(message, 'warning', duration);
  const info = (message: string, duration?: number) => addToast(message, 'info', duration);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    ToastContainer: () => <ToastContainer toasts={toasts} onClose={removeToast} />,
  };
};

export { ToastContainer };
