'use client';

import React from 'react';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layouts/authenticated-layout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Award, Upload, Send } from 'lucide-react';

export default function AthleteDashboardPage() {
  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome to your AthleteShield dashboard
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Documents</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">0</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900/30">
                  <CheckCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending Verifications</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">0</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
                  <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Credentials</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">0</p>
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
            <div className="grid gap-4 sm:grid-cols-2">
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
