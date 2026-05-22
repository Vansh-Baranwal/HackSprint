'use client';

import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layouts/authenticated-layout';
import { AuditLogTable } from '@/components/features/audit-log-table';
import { AuditLogDetails } from '@/components/features/audit-log-details';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/toast';
import { apiClient } from '@/lib/api/client';
import type { AuditLog } from '@/types';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await apiClient.get<AuditLog[]>('/admin/audit-logs');
      setLogs(data);
    } catch (err: any) {
      error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const handleExport = (format: 'csv' | 'json') => {
    try {
      const data = format === 'json' ? JSON.stringify(logs, null, 2) : convertToCSV(logs);
      const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${Date.now()}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
      success(`Audit logs exported as ${format.toUpperCase()}`);
    } catch (err) {
      error('Failed to export audit logs');
    }
  };

  const convertToCSV = (data: AuditLog[]) => {
    const headers = ['Timestamp', 'User ID', 'Action', 'Resource Type', 'Resource ID', 'IP Address'];
    const rows = data.map((log) => [
      new Date(log.createdAt).toISOString(),
      log.actorUserId || 'System',
      log.action,
      log.resourceType,
      log.resourceId || '',
      log.ipAddress || '',
    ]);
    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  };

  return (
    <AuthenticatedLayout>
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Audit Logs
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View and export system audit logs
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <AuditLogTable
            logs={logs}
            onViewDetails={handleViewDetails}
            onExport={handleExport}
          />
        )}

        <AuditLogDetails
          log={selectedLog}
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
        />
      </div>
    </AuthenticatedLayout>
  );
}
