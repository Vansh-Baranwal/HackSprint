'use client';

import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layouts/authenticated-layout';
import { MetricCard } from '@/components/features/metric-card';
import { TimeSeriesChart } from '@/components/features/time-series-chart';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/toast';
import { apiClient } from '@/lib/api/client';
import type { SystemMetrics, TimeSeriesData } from '@/types';

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Auto-refresh every 60 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const [metricsData, timeSeriesResponse] = await Promise.all([
        apiClient.get<SystemMetrics>('/admin/metrics'),
        apiClient.get<TimeSeriesData[]>('/admin/metrics/time-series'),
      ]);
      setMetrics(metricsData);
      setTimeSeriesData(timeSeriesResponse);
    } catch (err: any) {
      error('Failed to load metrics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              System Metrics
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Monitor platform performance and usage
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Auto-refreshes every 60 seconds
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <MetricCard
            title="Total Users"
            value={metrics?.totalUsers || 0}
            icon={
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            }
          />
          <MetricCard
            title="Active Verifications"
            value={metrics?.activeVerifications || 0}
            icon={
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <MetricCard
            title="Issued Credentials"
            value={metrics?.issuedCredentials || 0}
            icon={
              <svg
                className="w-8 h-8 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
          />
          <MetricCard
            title="Pending Reports"
            value={metrics?.pendingReports || 0}
            icon={
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            }
          />
        </div>

        {metrics?.usersByRole && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Users by Role
            </h3>
            <div className="grid gap-4 md:grid-cols-5">
              {Object.entries(metrics.usersByRole).map(([role, count]) => (
                <div key={role} className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {count}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {role.replace(/_/g, ' ')}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {timeSeriesData.length > 0 && (
          <Card className="p-6">
            <TimeSeriesChart
              data={timeSeriesData}
              title="Activity Over Time"
            />
          </Card>
        )}

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            System Health
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                API Status
              </span>
              <Badge
                variant={
                  metrics?.systemHealth.apiStatus === 'HEALTHY'
                    ? 'success'
                    : metrics?.systemHealth.apiStatus === 'DEGRADED'
                    ? 'warning'
                    : 'error'
                }
              >
                {metrics?.systemHealth.apiStatus || 'UNKNOWN'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Database Status
              </span>
              <Badge
                variant={
                  metrics?.systemHealth.databaseStatus === 'HEALTHY'
                    ? 'success'
                    : metrics?.systemHealth.databaseStatus === 'DEGRADED'
                    ? 'warning'
                    : 'error'
                }
              >
                {metrics?.systemHealth.databaseStatus || 'UNKNOWN'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Queue Status
              </span>
              <Badge
                variant={
                  metrics?.systemHealth.queueStatus === 'HEALTHY'
                    ? 'success'
                    : metrics?.systemHealth.queueStatus === 'DEGRADED'
                    ? 'warning'
                    : 'error'
                }
              >
                {metrics?.systemHealth.queueStatus || 'UNKNOWN'}
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
