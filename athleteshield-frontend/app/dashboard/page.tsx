'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layouts/authenticated-layout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiClient } from '@/lib/api/client';
import type { User } from '@/types';
import { UserRole } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await apiClient.get<User>('/auth/me');
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
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!user) {
    return null;
  }

  const getRoleName = (role: UserRole) => {
    const roleNames = {
      [UserRole.ATHLETE]: 'Athlete',
      [UserRole.COACH]: 'Coach',
      [UserRole.FEDERATION]: 'Federation',
      [UserRole.ADMIN]: 'Administrator',
      [UserRole.INVESTIGATOR]: 'Investigator',
    };
    return roleNames[role] || role;
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome, {user.firstName || user.email}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Role: {user.roles.map(getRoleName).join(', ')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                Your dashboard is being set up. Check back soon for updates.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
