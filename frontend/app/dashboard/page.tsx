'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { UserRole } from '@/types';
import type { User } from '@/types';

import AthleteDashboardPage from '@/app/(athlete)/dashboard/athlete-dashboard';
import AdminDashboardPage from '@/app/(admin)/dashboard/admin-dashboard';
import FederationDashboardPage from '@/app/(federation)/dashboard/federation-dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Read user directly from localStorage
    try {
      const storedUser = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');

      if (storedUser && accessToken) {
        setUser(JSON.parse(storedUser));
      } else {
        router.push('/login');
        return;
      }
    } catch {
      router.push('/login');
      return;
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Render role-specific dashboard
  if (user.roles?.includes(UserRole.ADMIN)) {
    return <AdminDashboardPage />;
  }
  
  if (user.roles?.includes(UserRole.FEDERATION)) {
    return <FederationDashboardPage />;
  }

  if (user.roles?.includes(UserRole.ATHLETE)) {
    return <AthleteDashboardPage />;
  }

  // fallback
  return <AthleteDashboardPage />;
}
