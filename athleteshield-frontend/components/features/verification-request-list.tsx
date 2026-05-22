'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, type SelectOption } from '@/components/ui/select';
import type { VerificationRequest, VerificationRequestStatus } from '@/types';
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

export interface VerificationRequestListProps {
  requests: VerificationRequest[];
  onViewDetails?: (request: VerificationRequest) => void;
}

const statusOptions: SelectOption[] = [
  { value: '', label: 'All Statuses' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const getStatusBadgeVariant = (status: VerificationRequestStatus) => {
  switch (status) {
    case 'APPROVED':
      return 'approved';
    case 'REJECTED':
      return 'rejected';
    case 'IN_REVIEW':
      return 'warning';
    case 'REQUESTED':
      return 'pending';
    case 'CANCELLED':
      return 'default';
    default:
      return 'default';
  }
};

const getStatusIcon = (status: VerificationRequestStatus) => {
  switch (status) {
    case 'APPROVED':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'REJECTED':
      return <XCircle className="h-5 w-5 text-red-600" />;
    case 'IN_REVIEW':
    case 'REQUESTED':
      return <Clock className="h-5 w-5 text-yellow-600" />;
    default:
      return null;
  }
};

export const VerificationRequestList: React.FC<VerificationRequestListProps> = ({
  requests,
  onViewDetails,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('');

  const filteredRequests = filterStatus
    ? requests.filter((req) => req.status === filterStatus)
    : requests;

  const sortedRequests = [...filteredRequests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>My Verification Requests</CardTitle>
          <div className="w-48">
            <Select
              options={statusOptions}
              value={filterStatus}
              onChange={setFilterStatus}
            />
          </div>
        </div>
      </CardHeader>
      <CardBody>
        {sortedRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No verification requests found
          </div>
        ) : (
          <div className="space-y-4">
            {sortedRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          Verification Request
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Submitted on {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Status:
                        </span>
                        <Badge variant={getStatusBadgeVariant(request.status)}>
                          {request.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>

                      {request.purpose && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Purpose:</span> {request.purpose}
                        </p>
                      )}

                      {request.reviewerNotes && (
                        <div className="mt-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Reviewer Notes:
                          </p>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {request.reviewerNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {onViewDetails && (
                    <button
                      onClick={() => onViewDetails(request)}
                      className="ml-4 rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                      title="View details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};
