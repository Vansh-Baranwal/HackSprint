'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AbuseReport, ReportStatus, ReportSeverity } from '@/types';

interface ReportCardProps {
  report: AbuseReport;
  onViewDetails: (report: AbuseReport) => void;
}

const statusColors: Record<ReportStatus, 'default' | 'warning' | 'error' | 'success'> = {
  SUBMITTED: 'default',
  TRIAGED: 'warning',
  ASSIGNED: 'warning',
  INVESTIGATING: 'warning',
  ESCALATED: 'error',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const severityColors: Record<ReportSeverity, 'default' | 'warning' | 'error'> = {
  UNKNOWN: 'default',
  LOW: 'default',
  MEDIUM: 'warning',
  HIGH: 'error',
  CRITICAL: 'error',
};

export function ReportCard({ report, onViewDetails }: ReportCardProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {report.title || 'Incident Report'}
              </h3>
              <Badge variant={statusColors[report.status]}>
                {report.status}
              </Badge>
              <Badge variant={severityColors[report.severity]}>
                {report.severity}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ID: {report.publicTrackingId}
            </p>
          </div>
        </div>

        {report.aiSummary && (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {report.aiSummary}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Submitted</p>
            <p className="text-gray-900 dark:text-gray-100">
              {new Date(report.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Assigned To</p>
            <p className="text-gray-900 dark:text-gray-100">
              {report.assignedToUserId ? 'Investigator' : 'Unassigned'}
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewDetails(report)}
            className="flex-1"
          >
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
}
