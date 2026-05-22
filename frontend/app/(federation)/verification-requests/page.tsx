'use client';

import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layouts/authenticated-layout';
import { VerificationRequestCard } from '@/components/features/verification-request-card';
import { RejectionModal } from '@/components/features/rejection-modal';
import { DocumentPreview } from '@/components/features/document-preview';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/toast';
import { apiClient } from '@/lib/api/client';
import type { VerificationRequest, Document } from '@/types';

interface RequestWithDetails extends VerificationRequest {
  athlete?: {
    firstName: string;
    lastName: string;
  };
  athleteProfile?: any;
  documents?: Document[];
}

export default function FederationVerificationRequestsPage() {
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const { success, error } = useToast();

  async function fetchRequests() {
    try {
      const data = await apiClient.get<RequestWithDetails[]>('/verification-requests/pending');
      setRequests(data);
    } catch {
      error('Failed to load verification requests');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (request: VerificationRequest) => {
    try {
      await apiClient.post(`/verification-requests/${request.id}/approve`);
      success('Verification request approved successfully');
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setShowRejectionModal(true);
  };

  const handleConfirmRejection = async (reason: string) => {
    if (!selectedRequest) return;

    try {
      await apiClient.post(`/verification-requests/${selectedRequest.id}/reject`, {
        reason,
      });
      success('Verification request rejected');
      setRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id));
      setShowRejectionModal(false);
      setSelectedRequest(null);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleViewDocument = (documentId: string) => {
    let foundDoc: Document | null = null;
    for (const req of requests) {
      if (req.documents) {
        const doc = req.documents.find((d) => d.id === documentId);
        if (doc) {
          foundDoc = doc;
          break;
        }
      }
    }

    if (foundDoc) {
      setSelectedDocument(foundDoc);
      setShowDocumentPreview(true);
    } else {
      error('Failed to load document');
    }
  };

  const handleDownloadDocument = async (document: Document) => {
    try {
      const blob = await apiClient.get<Blob>(`/documents/${document.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalFileName;
      link.click();
      window.URL.revokeObjectURL(url);
      success('Document downloaded successfully');
    } catch (err: any) {
      error('Failed to download document');
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Verification Requests
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Review and approve athlete verification requests
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No pending verification requests.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <VerificationRequestCard
                key={request.id}
                request={request}
                athleteName={
                  request.athlete
                    ? `${request.athlete.firstName} ${request.athlete.lastName}`
                    : undefined
                }
                athleteProfile={request.athleteProfile}
                documents={request.documents}
                onApprove={handleApprove}
                onReject={handleReject}
                onViewDocument={handleViewDocument}
              />
            ))}
          </div>
        )}

        <RejectionModal
          isOpen={showRejectionModal}
          onClose={() => {
            setShowRejectionModal(false);
            setSelectedRequest(null);
          }}
          onConfirm={handleConfirmRejection}
          requestId={selectedRequest?.id}
        />

        <DocumentPreview
          document={selectedDocument}
          isOpen={showDocumentPreview}
          onClose={() => {
            setShowDocumentPreview(false);
            setSelectedDocument(null);
          }}
          onDownload={handleDownloadDocument}
        />
      </div>
    </AuthenticatedLayout>
  );
}
