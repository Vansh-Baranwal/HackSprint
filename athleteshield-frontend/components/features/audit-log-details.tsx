'use client';

import { Modal } from '@/components/ui/modal';
import type { AuditLog } from '@/types';

interface AuditLogDetailsProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AuditLogDetails({ log, isOpen, onClose }: AuditLogDetailsProps) {
  if (!log) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Audit Log Details">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Timestamp</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(log.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">User ID</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {log.actorUserId || 'System'}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Action</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{log.action}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Resource Type</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{log.resourceType}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Resource ID</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {log.resourceId || 'N/A'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">IP Address</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {log.ipAddress || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Request ID</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {log.requestId || 'N/A'}
            </p>
          </div>
        </div>

        {log.userAgent && (
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">User Agent</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 break-all">
              {log.userAgent}
            </p>
          </div>
        )}

        {log.metadata && (
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Additional Data
            </p>
            <pre className="text-xs text-gray-600 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-auto max-h-64">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
}
