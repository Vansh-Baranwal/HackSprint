'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { AbuseReport, ReportStatus } from '@/types';

interface ReportDetailsProps {
  report: AbuseReport;
  onUpdate: (reportId: string, updates: { status?: ReportStatus }) => Promise<void>;
}

export function ReportDetails({ report, onUpdate }: ReportDetailsProps) {
  const [status, setStatus] = useState(report.status);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: any = {};
      if (status !== report.status) updates.status = status;

      if (Object.keys(updates).length > 0) {
        await onUpdate(report.id, updates);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = status !== report.status;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {report.title || 'Incident Report'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Report ID: {report.publicTrackingId}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Current Status
            </p>
            <Badge variant="default">{report.status}</Badge>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Severity
            </p>
            <Badge variant="warning">{report.severity}</Badge>
          </div>
        </div>

        {report.aiSummary && (
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Incident Description
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {report.aiSummary}
            </p>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Evidence Files
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {report.metadata?.evidenceCount || 0} file(s) attached
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Investigation Timeline
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Report Submitted
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            {report.updatedAt !== report.createdAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Last Updated
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {new Date(report.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Update Report
          </h3>

          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ReportStatus)}
            options={[
              { value: 'SUBMITTED', label: 'Submitted' },
              { value: 'TRIAGED', label: 'Triaged' },
              { value: 'ASSIGNED', label: 'Assigned' },
              { value: 'INVESTIGATING', label: 'Investigating' },
              { value: 'ESCALATED', label: 'Escalated' },
              { value: 'RESOLVED', label: 'Resolved' },
              { value: 'CLOSED', label: 'Closed' },
            ]}
          />

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              loading={isSaving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
