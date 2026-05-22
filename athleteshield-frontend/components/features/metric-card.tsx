'use client';

import { Card } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: number | string;
  trend?: {
    direction: 'up' | 'down';
    value: number;
    period: string;
  };
  icon?: React.ReactNode;
}

export function MetricCard({ title, value, trend, icon }: MetricCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.direction === 'up' ? (
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              )}
              <span
                className={`text-sm ${
                  trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.value}% vs {trend.period}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
