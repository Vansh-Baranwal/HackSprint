'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layouts/authenticated-layout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Award, Upload, Send } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

export default function AthleteDashboardPage() {
  const [metrics, setMetrics] = useState({
    documents: 0,
    pendingVerifications: 0,
    activeCredentials: 0
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [profile, verifications, credentials] = await Promise.all([
          apiClient.get<any>('/athlete/profile').catch(() => null),
          apiClient.get<any[]>('/verifications/my-requests').catch(() => []),
          apiClient.get<any[]>('/credentials/my-credentials').catch(() => [])
        ]);

        let docsCount = 0;
        if (profile?.documents) docsCount = profile.documents.length;
        // Check local storage if API failed but they uploaded something locally
        if (docsCount === 0 && localStorage.getItem('athlete_upload_qr_token')) {
          docsCount = 1;
        }

        const pendingCount = (verifications || []).filter(v => v.status === 'PENDING').length;
        const activeCredCount = (credentials || []).filter(c => c.status === 'ISSUED' || c.status === 'SIGNED').length;

        setMetrics({
          documents: docsCount,
          pendingVerifications: pendingCount,
          activeCredentials: activeCredCount
        });
      } catch (err) {
        // Silently fail
      }
    };
    fetchMetrics();
  }, []);

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading uppercase tracking-tight">
            Dashboard
          </h1>
          <p className="mt-2 text-xs text-orange-400 font-bank uppercase tracking-wider">
            Welcome to your Khel Setu dashboard
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-orange-500/20 p-3 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                  <FileText className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bank uppercase tracking-wider">Documents</p>
                  <p className="text-2xl font-bold text-white font-heading">{metrics.documents}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-amber-500/20 p-3 shadow-[0_0_15px_rgba(251,191,36,0.15)]">
                  <CheckCircle className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bank uppercase tracking-wider">Pending Verifications</p>
                  <p className="text-2xl font-bold text-white font-heading">{metrics.pendingVerifications}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-red-500/20 p-3 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                  <Award className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bank uppercase tracking-wider">Active Credentials</p>
                  <p className="text-2xl font-bold text-white font-heading">{metrics.activeCredentials}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
                  <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Verifications</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">0</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Link href="/documents">
                <Button variant="secondary" className="w-full justify-start">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Document
                </Button>
              </Link>
              <Link href="/verifications">
                <Button variant="secondary" className="w-full justify-start">
                  <Send className="mr-2 h-5 w-5" />
                  Request Verification
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No recent activity
            </div>
          </CardBody>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
