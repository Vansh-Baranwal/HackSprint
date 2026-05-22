'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ReportStatus } from '@/types';

interface ReportTrackingFormProps {
  onSubmit: (trackingId: string) => Promise<void>;
  reportData?: {
    status: ReportStatus;
    timeline: Array<{ status: string; timestamp: string }>;
  } | null;
  error?: string;
}

const statusColors: Record<ReportStatus, 'default' | 'warning' | 'success'> = {
  SUBMITTED: 'default',
  TRIAGED: 'warning',
  ASSIGNED: 'warning',
  INVESTIGATING: 'warning',
  ESCALATED: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
};

export function ReportTrackingForm({ onSubmit, reportData, error }: ReportTrackingFormProps) {
  const [trackingId, setTrackingId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(trackingId.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tracking ID"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="Enter your report tracking ID"
            required
          />
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting} className="w-full">
            Track Report
          </Button>
        </form>
      </Card>

      {error && (
        <Card className="p-6 bg-red-50 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </Card>
      )}

      {reportData && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Report Status
          </h3>

          <div className="mb-6">
            <Badge variant={statusColors[reportData.status]} className="text-lg px-4 py-2">
              {reportData.status.replace(/_/g, ' ')}
            </Badge>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Status Timeline
            </h4>
            <div className="space-y-3">
              {reportData.timeline.map((entry, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {entry.status.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              Note: For privacy and security reasons, detailed investigation information is not
              displayed publicly.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
