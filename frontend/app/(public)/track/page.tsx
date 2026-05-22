'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ReportTrackingForm } from '@/components/features/report-tracking-form';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import type { ReportStatus } from '@/types';

export default function ReportTrackingPage() {
  const [reportData, setReportData] = useState<{
    status: ReportStatus;
    timeline: Array<{ status: string; timestamp: string }>;
  } | null>(null);
  const [error, setError] = useState('');

  const handleTrack = async (trackingId: string) => {
    try {
      setError('');
      const response = await apiClient.get<any>(`/public/reports/track/${trackingId}`);
      setReportData({
        status: response.status,
        timeline: response.timeline || [
          { status: response.status, timestamp: response.updatedAt },
        ],
      });
    } catch (err: any) {
      setError(
        err.response?.status === 404
          ? 'Report not found. Please check your tracking ID and try again.'
          : 'Failed to retrieve report status. Please try again later.'
      );
      setReportData(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="secondary" size="sm">
              ← Back to Home
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Track Your Report
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Enter your tracking ID to check the status of your report
          </p>
        </div>

        <ReportTrackingForm
          onSubmit={handleTrack}
          reportData={reportData}
          error={error}
        />

        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Report Status Definitions
          </h3>
          <dl className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <div>
              <dt className="font-medium text-gray-900 dark:text-gray-100">SUBMITTED</dt>
              <dd>Your report has been received and is awaiting initial review</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900 dark:text-gray-100">TRIAGED</dt>
              <dd>Your report has been reviewed and prioritized</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900 dark:text-gray-100">INVESTIGATING</dt>
              <dd>An investigator is actively working on your case</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900 dark:text-gray-100">RESOLVED</dt>
              <dd>The investigation has been completed</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900 dark:text-gray-100">CLOSED</dt>
              <dd>The case has been closed</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
