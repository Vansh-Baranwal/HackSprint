'use client';

import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layouts/authenticated-layout';
import { CredentialCard } from '@/components/features/credential-card';
import { QRCodeDisplay } from '@/components/features/qr-code-display';
import { QRVerificationPanel } from '@/components/features/qr-verification-panel';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/toast';
import { apiClient } from '@/lib/api/client';
import type { Credential } from '@/types';

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [qrToken, setQrToken] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  const [cachedQrToken, setCachedQrToken] = useState<string | null>(null);
  const { success, error } = useToast();

  useEffect(() => {
    fetchCredentials();
    const token = localStorage.getItem('athlete_upload_qr_token');
    if (token) setCachedQrToken(token);
  }, []);

  const fetchCredentials = async () => {
    try {
      const data = await apiClient.get<Credential[]>('/credentials/my-credentials');
      setCredentials(data);
    } catch (err: any) {
      error('Failed to load credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQR = async (credential: Credential) => {
    try {
      const response = await apiClient.post<{ token: string; qrSession: any }>(
        `/credentials/${credential.id}/generate-qr`
      );
      setQrToken(response.token);
      setSelectedCredential(credential);
      setShowQR(true);
      success('QR code generated successfully');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to generate QR code');
    }
  };

  const handleDownload = async (credential: Credential) => {
    try {
      const blob = await apiClient.get<Blob>(`/credentials/${credential.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `credential-${credential.id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      success('Credential downloaded successfully');
    } catch (err: any) {
      error('Failed to download credential');
    }
  };

  const activeCredentials = credentials.filter(
    (c) => c.status === 'ISSUED' || c.status === 'SIGNED'
  );
  const expiredCredentials = credentials.filter((c) => c.status === 'EXPIRED');
  const revokedCredentials = credentials.filter((c) => c.status === 'REVOKED');

  return (
    <AuthenticatedLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            My Credentials
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View and manage your verified credentials
          </p>
        </div>

        {cachedQrToken && (
          <div className="mb-8 border border-white/10 p-6 rounded-2xl bg-black/40 backdrop-blur-xl shadow-2xl">
            <h2 className="text-xl font-heading uppercase tracking-widest text-white mb-6 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
              Latest Document Verification QR
            </h2>
            <QRVerificationPanel qrToken={cachedQrToken} />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : credentials.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              You don't have any credentials yet.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Credentials will appear here once your verification requests are approved.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeCredentials.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Active Credentials
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {activeCredentials.map((credential) => (
                    <CredentialCard
                      key={credential.id}
                      credential={credential}
                      onGenerateQR={handleGenerateQR}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
              </div>
            )}

            {expiredCredentials.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Expired Credentials
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {expiredCredentials.map((credential) => (
                    <CredentialCard
                      key={credential.id}
                      credential={credential}
                      onGenerateQR={handleGenerateQR}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
              </div>
            )}

            {revokedCredentials.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Revoked Credentials
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {revokedCredentials.map((credential) => (
                    <CredentialCard
                      key={credential.id}
                      credential={credential}
                      onGenerateQR={handleGenerateQR}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showQR && selectedCredential && (
          <QRCodeDisplay
            token={qrToken}
            isOpen={showQR}
            onClose={() => setShowQR(false)}
            credentialType={selectedCredential.type}
          />
        )}
      </div>
    </AuthenticatedLayout>
  );
}
