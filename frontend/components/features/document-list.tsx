'use client';

import React, { useState } from 'react';
import { Table, type Column } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, type SelectOption } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import type { Document, DocumentType, DocumentStatus } from '@/types';
import { FileText, Download, Trash2, Eye } from 'lucide-react';

export interface DocumentListProps {
  documents: Document[];
  onDelete?: (documentId: string) => Promise<void>;
  onPreview?: (document: Document) => void;
}

const documentTypeOptions: SelectOption[] = [
  { value: '', label: 'All Types' },
  { value: 'ID_PROOF', label: 'ID Proof' },
  { value: 'MEDICAL_RECORD', label: 'Medical Record' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'ACHIEVEMENT', label: 'Achievement' },
  { value: 'OTHER', label: 'Other' },
];

const getStatusBadgeVariant = (status: DocumentStatus) => {
  switch (status) {
    case 'AVAILABLE':
      return 'success';
    case 'PENDING_SCAN':
      return 'warning';
    case 'QUARANTINED':
      return 'error';
    case 'DELETED':
      return 'default';
    default:
      return 'default';
  }
};

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDelete,
  onPreview,
}) => {
  const [filterType, setFilterType] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredDocuments = filterType
    ? documents.filter((doc) => doc.documentType === filterType)
    : documents;

  const sortedDocuments = [...filteredDocuments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleDelete = async (documentId: string) => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(documentId);
      setDeleteConfirmId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const columns: Column<Document>[] = [
    {
      key: 'originalFileName',
      header: 'Filename',
      sortable: true,
      render: (doc) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{doc.originalFileName}</span>
        </div>
      ),
    },
    {
      key: 'documentType',
      header: 'Type',
      sortable: true,
      render: (doc) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {doc.documentType.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'sizeBytes',
      header: 'Size',
      render: (doc) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatFileSize(doc.sizeBytes)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Upload Date',
      sortable: true,
      render: (doc) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(doc.createdAt)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (doc) => (
        <Badge variant={getStatusBadgeVariant(doc.status)}>
          {doc.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (doc) => (
        <div className="flex items-center gap-2">
          {onPreview && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onPreview(doc)}
              title="Preview"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeleteConfirmId(doc.id)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Documents</CardTitle>
            <div className="w-48">
              <Select
                options={documentTypeOptions}
                value={filterType}
                onChange={setFilterType}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <Table
            columns={columns}
            data={sortedDocuments}
            keyExtractor={(doc) => doc.id}
            emptyMessage="No documents uploaded yet"
          />
        </CardBody>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Document"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteConfirmId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to delete this document? This action cannot be undone.
        </p>
      </Modal>
    </>
  );
};
