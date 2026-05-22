'use client';

import React, { useState } from 'react';
import { FileUpload } from '@/components/ui/file-upload';
import { Select, type SelectOption } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card';
import { DocumentType } from '@/types';
import { Shield } from 'lucide-react';

export interface DocumentUploadProps {
  onUpload: (file: File, documentType: DocumentType) => Promise<void>;
}

const documentTypeOptions: SelectOption[] = [
  { value: DocumentType.ID_PROOF, label: 'ID Proof' },
  { value: DocumentType.MEDICAL_RECORD, label: 'Medical Record' },
  { value: DocumentType.CERTIFICATE, label: 'Certificate' },
  { value: DocumentType.ACHIEVEMENT, label: 'Achievement' },
  { value: DocumentType.OTHER, label: 'Other' },
];

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUpload }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.ID_PROOF);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        await onUpload(files[i], documentType);
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }
      setFiles([]);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="space-y-6">
          <Select
            label="Document Type"
            options={documentTypeOptions}
            value={documentType}
            onChange={(value) => setDocumentType(value as DocumentType)}
            disabled={isUploading}
            required
          />

          <FileUpload
            label="Select Files"
            accept={{
              'application/pdf': ['.pdf'],
              'image/jpeg': ['.jpg', '.jpeg'],
              'image/png': ['.png'],
            }}
            maxSize={10 * 1024 * 1024} // 10MB
            multiple={true}
            onFilesChange={handleFilesChange}
            disabled={isUploading}
            progress={isUploading ? uploadProgress : undefined}
          />

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold">Encryption Notice</p>
                <p className="mt-1">
                  All uploaded files are encrypted end-to-end before storage. Only you and
                  authorized federations can access your documents during verification.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading}
              isLoading={isUploading}
            >
              {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload Documents'}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
