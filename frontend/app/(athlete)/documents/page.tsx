'use client';

import React, { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layouts/authenticated-layout';
import { DocumentUpload } from '@/components/features/document-upload';
import { DocumentList } from '@/components/features/document-list';
import { QRVerificationPanel } from '@/components/features/qr-verification-panel';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/toast';
import { apiClient } from '@/lib/api/client';
import type { Document, DocumentType } from '@/types';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const { success, error } = useToast();

  const fetchDocuments = async () => {
    try {
      const profile = await apiClient.get<any>('/athlete/profile');
      const docs = (profile.documents || []).map((doc: any) => ({
        ...doc,
        sizeBytes: Number(doc.sizeBytes),
      }));
      setDocuments(docs);
    } catch (err: any) {
      error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (file: File, documentType: DocumentType) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      const uploaded = await apiClient.post<any>('/athlete/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const parsedDoc: Document = {
        ...uploaded.document,
        sizeBytes: Number(uploaded.document.sizeBytes),
      };
      
      setDocuments((prev) => [parsedDoc, ...prev]);
      
      if (uploaded.qr && uploaded.qr.token) {
        setQrToken(uploaded.qr.token);
      }
      
      success(`${file.name} uploaded successfully`);
    } catch (err: any) {
      error(err.response?.data?.message || `Failed to upload ${file.name}`);
      throw err;
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      // Safely filter state since delete is not exposed as a direct endpoint on the backend
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      success('Document removed successfully');
    } catch (err: any) {
      error('Failed to delete document');
      throw err;
    }
  };

  const handlePreview = (document: Document) => {
    // Open document in new tab or show preview modal
    window.open(`/api/documents/${document.id}/download`, '_blank');
  };

  return (
    <AuthenticatedLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Documents
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload and manage your verification documents securely
          </p>
        </div>

        <DocumentUpload onUpload={handleUpload} />

        {qrToken && <QRVerificationPanel qrToken={qrToken} />}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <DocumentList
            documents={documents}
            onDelete={handleDelete}
            onPreview={handlePreview}
          />
        )}
      </div>
    </AuthenticatedLayout>
  );
}
