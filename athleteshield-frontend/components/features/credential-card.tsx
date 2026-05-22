'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Credential, CredentialStatus } from '@/types';

interface CredentialCardProps {
  credential: Credential;
  onGenerateQR: (credential: Credential) => void;
  onDownload: (credential: Credential) => void;
}

const statusColors: Record<CredentialStatus, 'success' | 'warning' | 'error' | 'default'> = {
  DRAFT: 'default',
  ISSUED: 'success',
  SIGNED: 'success',
  REVOKED: 'error',
  EXPIRED: 'warning',
};

export function CredentialCard({ credential, onGenerateQR, onDownload }: CredentialCardProps) {
  const isActive = credential.status === 'ISSUED' || credential.status === 'SIGNED';
  const isRevoked = credential.status === 'REVOKED';
  const isExpired = credential.status === 'EXPIRED';

  return (
    <Card className={isRevoked ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : ''}>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {credential.type.replace(/_/g, ' ')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              ID: {credential.id.slice(0, 8)}...
            </p>
          </div>
          <Badge variant={statusColors[credential.status]}>
            {credential.status}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Issued:</span>
            <span className="text-gray-900 dark:text-gray-100">
              {credential.issuedAt ? new Date(credential.issuedAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Expires:</span>
            <span className="text-gray-900 dark:text-gray-100">
              {credential.expiresAt ? new Date(credential.expiresAt).toLocaleDateString() : 'Never'}
            </span>
          </div>
          {isRevoked && credential.revokedAt && (
            <div className="flex justify-between text-red-600 dark:text-red-400">
              <span>Revoked:</span>
              <span>{new Date(credential.revokedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {isRevoked && (
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-md space-y-2">
            <p className="text-sm font-semibold text-red-800 dark:text-red-200">
              This credential has been revoked and is no longer valid.
            </p>
            {credential.payload?.revocationReason && (
              <p className="text-sm text-red-700 dark:text-red-300">
                Reason: {credential.payload.revocationReason}
              </p>
            )}
            <p className="text-xs text-red-600 dark:text-red-400">
              If you believe this was done in error, please contact the issuing federation to appeal.
            </p>
          </div>
        )}

        {isExpired && (
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              This credential has expired.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {isActive && (
            <Button onClick={() => onGenerateQR(credential)} className="flex-1">
              Generate QR Code
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => onDownload(credential)}
            className={isActive ? '' : 'flex-1'}
          >
            Download PDF
          </Button>
        </div>
      </div>
    </Card>
  );
}
