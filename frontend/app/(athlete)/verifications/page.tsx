'use client';

import React, { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layouts/authenticated-layout';
import { VerificationRequestForm } from '@/components/features/verification-request-form';
import { VerificationRequestList } from '@/components/features/verification-request-list';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/toast';
import { apiClient } from '@/lib/api/client';
import type { VerificationRequest, Document } from '@/types';

export default function VerificationsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  const fetchData = async () => {
    try {
      // 1. Fetch profile to get documents
      const profileData = await apiClient.get<any>('/athlete/profile');
      const docs = (profileData.documents || []).map((doc: any) => ({
        ...doc,
        sizeBytes: Number(doc.sizeBytes),
      }));
      setDocuments(docs);

      // 2. Fetch requests (wrap in its own try/catch because the endpoint might be 404)
      try {
        const requestsData = await apiClient.get<VerificationRequest[]>('/verification-requests/my-requests');
        setRequests(requestsData);
      } catch (reqErr) {
        setRequests([]);
      }
    } catch (err: any) {
      error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (data: {
    purpose: string;
    documentIds: string[];
  }) => {
    try {
      const newRequest = await apiClient.post<VerificationRequest>('/verification-requests', {
        purpose: data.purpose,
        requestedClaims: {
          documentIds: data.documentIds,
        },
      });
      setRequests((prev) => [newRequest, ...prev]);
      success('Verification request submitted successfully');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to submit verification request');
      throw err;
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Verifications
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Request verification from federations and track your requests
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <VerificationRequestForm documents={documents} onSubmit={handleSubmit} />
            <VerificationRequestList requests={requests} />
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
