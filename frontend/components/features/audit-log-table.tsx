'use client';

import { useState } from 'react';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { AuditLog } from '@/types';

interface AuditLogTableProps {
  logs: AuditLog[];
  onViewDetails: (log: AuditLog) => void;
  onExport: (format: 'csv' | 'json') => void;
}

export function AuditLogTable({ logs, onViewDetails, onExport }: AuditLogTableProps) {
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  const filteredLogs = logs.filter((log) => {
    if (actionFilter && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) {
      return false;
    }
    if (resourceFilter && !log.resourceType.toLowerCase().includes(resourceFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (log: AuditLog) => new Date(log.createdAt).toLocaleString(),
    },
    {
      key: 'user',
      header: 'User',
      render: (log: AuditLog) => log.actorUserId?.slice(0, 8) || 'System',
    },
    {
      key: 'action',
      header: 'Action',
      render: (log: AuditLog) => log.action,
    },
    {
      key: 'resource',
      header: 'Resource',
      render: (log: AuditLog) => `${log.resourceType}${log.resourceId ? ` (${log.resourceId.slice(0, 8)})` : ''}`,
    },
    {
      key: 'ip',
      header: 'IP Address',
      render: (log: AuditLog) => log.ipAddress || 'N/A',
    },
    {
      key: 'actions',
      header: '',
      render: (log: AuditLog) => (
        <Button size="sm" variant="secondary" onClick={() => onViewDetails(log)}>
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <Input
          label="Filter by Action"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          placeholder="e.g., CREATE, UPDATE, DELETE"
        />
        <Input
          label="Filter by Resource"
          value={resourceFilter}
          onChange={(e) => setResourceFilter(e.target.value)}
          placeholder="e.g., User, Document"
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => onExport('csv')}>
            Export CSV
          </Button>
          <Button variant="secondary" onClick={() => onExport('json')}>
            Export JSON
          </Button>
        </div>
      </div>

      <Table
        data={filteredLogs}
        columns={columns}
        keyExtractor={(log) => log.id}
        emptyMessage="No audit logs found"
      />
    </div>
  );
}
