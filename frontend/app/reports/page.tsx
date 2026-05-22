'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layouts/authenticated-layout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiClient } from '@/lib/api/client';
import type { User } from '@/types';
import { UserRole } from '@/types';

import AthleteReportsPage from '@/app/(athlete)/reports/athlete-reports';
import AdminReportsPage from '@/app/(admin)/reports/admin-reports';

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await apiClient.get<User>('/users/me');
        setUser(userData);
      } catch (err) {
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex h-full items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!user) {
    return null;
  }

  // The imported reports components already include their own AuthenticatedLayout.
  if (user.roles.includes(UserRole.ADMIN) || user.roles.includes(UserRole.INVESTIGATOR)) {
    return <AdminReportsPage />;
  }

  if (user.roles.includes(UserRole.ATHLETE)) {
    return <AthleteReportsPage />;
  }

  // fallback
  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Reports
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You do not have access to reports or this view is not supported for your role.
          </p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
