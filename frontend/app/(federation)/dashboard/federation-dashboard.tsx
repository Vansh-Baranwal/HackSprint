'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layouts/authenticated-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/toast';
import { apiClient } from '@/lib/api/client';

interface DashboardStats {
  pendingRequests: number;
  approvedVerifications: number;
  activeMembers: number;
  recentRequests: any[];
}

export default function FederationDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();

  async function fetchDashboardData() {
    try {
      const data = await apiClient.get<DashboardStats>('/federation/dashboard');
      setStats(data);
    } catch {
      error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading uppercase tracking-tight">
            Federation Dashboard
          </h1>
          <p className="mt-2 text-xs text-orange-400 font-bank uppercase tracking-wider">
            Overview of your federation's verification activities
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-bank uppercase tracking-wider">
                  Pending Requests
                </p>
                <p className="text-3xl font-bold text-white font-heading mt-2">
                  {stats?.pendingRequests || 0}
                </p>
              </div>
              <div className="p-3 bg-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.15)] rounded-lg">
                <svg
                  className="w-8 h-8 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-bank uppercase tracking-wider">
                  Approved Verifications
                </p>
                <p className="text-3xl font-bold text-white font-heading mt-2">
                  {stats?.approvedVerifications || 0}
                </p>
              </div>
              <div className="p-3 bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.15)] rounded-lg">
                <svg
                  className="w-8 h-8 text-green-400"
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
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-bank uppercase tracking-wider">
                  Active Members
                </p>
                <p className="text-3xl font-bold text-white font-heading mt-2">
                  {stats?.activeMembers || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)] rounded-lg">
                <svg
                  className="w-8 h-8 text-blue-400"
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
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight text-white font-heading uppercase">
              Recent Verification Requests
            </h2>
            <Link href="/verification-requests">
              <Button variant="secondary" size="sm">
                View All
              </Button>
            </Link>
          </div>

          {stats?.recentRequests && stats.recentRequests.length > 0 ? (
            <div className="space-y-4">
              {stats.recentRequests.slice(0, 5).map((request: any) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg transition-colors hover:bg-white/10"
                >
                  <div>
                    <p className="font-medium text-white">
                      {request.athleteName || 'Athlete'}
                    </p>
                    <p className="text-xs text-gray-400 font-bank mt-1">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={`/verification-requests`}>
                    <Button size="sm">Review</Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-400 py-8">
              No recent verification requests
            </p>
          )}
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-lg font-bold tracking-tight text-white font-heading uppercase mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link href="/verification-requests">
                <Button className="w-full justify-start">
                  Review Verification Requests
                </Button>
              </Link>
              <Link href="/members">
                <Button variant="secondary" className="w-full justify-start">
                  Manage Members
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold tracking-tight text-white font-heading uppercase mb-4">
              Federation Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400 font-bank tracking-wider">Status:</span>
                <span className="text-green-400 font-medium">
                  Active
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bank tracking-wider">Member Since:</span>
                <span className="text-white">
                  {new Date().getFullYear()}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
