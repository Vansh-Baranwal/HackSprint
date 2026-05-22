'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { VerificationRequest, VerificationRequestStatus } from '@/types';

interface VerificationRequestCardProps {
  request: VerificationRequest;
  athleteName?: string;
  athleteProfile?: any;
  documents?: any[];
  onApprove: (request: VerificationRequest) => void;
  onReject: (request: VerificationRequest) => void;
  onViewDocument: (documentId: string) => void;
}

const statusColors: Record<VerificationRequestStatus, 'default' | 'warning' | 'success' | 'error'> = {
  REQUESTED: 'default',
  IN_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'default',
};

export function VerificationRequestCard({
  request,
  athleteName,
  athleteProfile,
  documents = [],
  onApprove,
  onReject,
  onViewDocument,
}: VerificationRequestCardProps) {
  const isPending = request.status === 'REQUESTED' || request.status === 'IN_REVIEW';

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {athleteName || 'Athlete'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Request ID: {request.id.slice(0, 8)}...
            </p>
          </div>
          <Badge variant={statusColors[request.status]}>
            {request.status.replace(/_/g, ' ')}
          </Badge>
        </div>

        {athleteProfile && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Sport:</span>
              <span className="text-gray-900 dark:text-gray-100">
                {athleteProfile.primarySport || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Nationality:</span>
              <span className="text-gray-900 dark:text-gray-100">
                {athleteProfile.nationality || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Athlete Code:</span>
              <span className="text-gray-900 dark:text-gray-100">
                {athleteProfile.athleteCode}
              </span>
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Request Date
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(request.createdAt).toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Purpose
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {request.purpose}
          </p>
        </div>

        {request.requestedClaims && (
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Verification Claims
            </p>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {typeof request.requestedClaims === 'object' ? (
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(request.requestedClaims, null, 2)}
                </pre>
              ) : (
                <p>{request.requestedClaims}</p>
              )}
            </div>
          </div>
        )}

        {documents.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Attached Documents ({documents.length})
            </p>
            <div className="space-y-2">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => onViewDocument(doc.id)}
                  className="w-full text-left p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {doc.originalFileName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {doc.documentType.replace(/_/g, ' ')} • {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {request.reviewerNotes && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              Reviewer Notes
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              {request.reviewerNotes}
            </p>
          </div>
        )}

        {isPending && (
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => onReject(request)}
              className="flex-1"
            >
              Reject
            </Button>
            <Button
              onClick={() => onApprove(request)}
              className="flex-1"
            >
              Approve
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
