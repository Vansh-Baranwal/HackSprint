'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AbuseReportForm } from '@/components/features/abuse-report-form';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';

export default function ReportSubmissionPage() {
  const [submitted, setSubmitted] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (data: {
    description: string;
    incidentDate: string;
    location: string;
    involvedParties: string;
    evidenceFiles: File[];
    anonymous: boolean;
  }) => {
    try {
      setError('');

      // Upload evidence files first
      const evidenceIds: string[] = [];
      for (const file of data.evidenceFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'EVIDENCE');

        const uploadResponse = await apiClient.post<{ id: string }>('/public/evidence/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        evidenceIds.push(uploadResponse.id);
      }

      // Submit report
      const response = await apiClient.post<{ publicTrackingId: string }>('/public/reports', {
        description: data.description,
        incidentDate: data.incidentDate,
        location: data.location,
        involvedParties: data.involvedParties,
        evidenceIds,
        anonymous: data.anonymous,
      });

      setTrackingId(response.publicTrackingId);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
      throw err;
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="mx-auto max-w-2xl">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Report Submitted Successfully
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for reporting this incident. Your report has been received and will be
              reviewed by our team.
            </p>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-6">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Your Tracking ID
              </p>
              <p className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                {trackingId}
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200 mt-2">
                Save this ID to track your report's status
              </p>
            </div>

            <div className="space-y-3">
              <Link href={`/track?id=${trackingId}`}>
                <Button className="w-full">Track Report Status</Button>
              </Link>
              <Link href="/">
                <Button variant="secondary" className="w-full">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="secondary" size="sm">
              ← Back to Home
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Report Abuse or Misconduct
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Your report helps us maintain a safe environment for all athletes. All reports are
            taken seriously and investigated thoroughly.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <AbuseReportForm onSubmit={handleSubmit} />

        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            What happens next?
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
            <li>Your report will be reviewed by our team within 24-48 hours</li>
            <li>You'll receive a tracking ID to monitor the status of your report</li>
            <li>An investigator may reach out for additional information if needed</li>
            <li>All information is kept confidential and secure</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
