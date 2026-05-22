'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QRScanner } from '@/components/features/qr-scanner';
import { CredentialVerificationDisplay } from '@/components/features/credential-verification-display';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';

export default function QRVerificationPage() {
  const [verificationData, setVerificationData] = useState<any>(null);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleScan = async (token: string) => {
    setIsVerifying(true);
    setError('');
    setVerificationData(null);

    try {
      const response = await apiClient.post<any>('/public/credentials/verify', { token });
      setVerificationData(response);
    } catch (err: any) {
      setError(
        err.response?.status === 404 || err.response?.status === 400
          ? 'Invalid or expired credential. Please check the QR code and try again.'
          : 'Failed to verify credential. Please try again later.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    setVerificationData(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="secondary" size="sm">
              ← Back to Home
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Verify Credential
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Scan a QR code or enter a token to verify an athlete's credential
          </p>
        </div>

        {isVerifying && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Verifying credential...
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        )}

        {verificationData ? (
          <div className="space-y-6">
            <CredentialVerificationDisplay data={verificationData} />
            <Button onClick={handleReset} variant="secondary" className="w-full">
              Verify Another Credential
            </Button>
          </div>
        ) : (
          <QRScanner onScan={handleScan} />
        )}

        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            About Credential Verification
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
            <li>Credentials are cryptographically signed and cannot be forged</li>
            <li>Verification is instant and does not require authentication</li>
            <li>Only public information is displayed during verification</li>
            <li>Revoked or expired credentials will be clearly marked</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
