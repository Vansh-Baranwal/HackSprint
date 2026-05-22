'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layouts/authenticated-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/toast';
import { apiClient } from '@/lib/api/client';

interface AdminDashboardData {
  totalReports: number;
  pendingInvestigations: number;
  auditLogEntries: number;
  recentReports: any[];
  systemHealth: {
    apiStatus: string;
    databaseStatus: string;
    queueStatus: string;
  };
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get<AdminDashboardData>('/admin/dashboard');
      setData(response);
    } catch (err: any) {
      error('Failed to load dashboard data');
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            System overview and administration
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Reports</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {data?.totalReports || 0}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
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
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pending Investigations
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {data?.pendingInvestigations || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <svg
                  className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Audit Log Entries
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {data?.auditLogEntries || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Recent Reports
              </h2>
              <Link href="/reports">
                <Button variant="secondary" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            {data?.recentReports && data.recentReports.length > 0 ? (
              <div className="space-y-4">
                {data.recentReports.slice(0, 5).map((report: any) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {report.title || 'Incident Report'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="warning">{report.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                No recent reports
              </p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              System Health
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  API Status
                </span>
                <Badge
                  variant={
                    data?.systemHealth.apiStatus === 'HEALTHY' ? 'success' : 'error'
                  }
                >
                  {data?.systemHealth.apiStatus || 'UNKNOWN'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Database Status
                </span>
                <Badge
                  variant={
                    data?.systemHealth.databaseStatus === 'HEALTHY' ? 'success' : 'error'
                  }
                >
                  {data?.systemHealth.databaseStatus || 'UNKNOWN'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Queue Status
                </span>
                <Badge
                  variant={
                    data?.systemHealth.queueStatus === 'HEALTHY' ? 'success' : 'error'
                  }
                >
                  {data?.systemHealth.queueStatus || 'UNKNOWN'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Quick Actions
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/reports">
              <Button className="w-full justify-start">View Reports</Button>
            </Link>
            <Link href="/audit-logs">
              <Button variant="secondary" className="w-full justify-start">
                View Audit Logs
              </Button>
            </Link>
            <Link href="/metrics">
              <Button variant="secondary" className="w-full justify-start">
                View Metrics
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
