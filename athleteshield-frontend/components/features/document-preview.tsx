'use client';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import type { Document } from '@/types';

interface DocumentPreviewProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (document: Document) => void;
}

export function DocumentPreview({ document, isOpen, onClose, onDownload }: DocumentPreviewProps) {
  if (!document) return null;

  const isPDF = document.mimeType === 'application/pdf';
  const isImage = document.mimeType.startsWith('image/');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={document.originalFileName}
      size="xl"
    >
      <div className="space-y-4">
        <div className="min-h-[400px] max-h-[600px] overflow-auto bg-gray-50 dark:bg-gray-900 rounded-lg">
          {isPDF && (
            <iframe
              src={`/api/documents/${document.id}/preview`}
              className="w-full h-[600px]"
              title={document.originalFileName}
            />
          )}
          {isImage && (
            <img
              src={`/api/documents/${document.id}/preview`}
              alt={document.originalFileName}
              className="w-full h-auto"
            />
          )}
          {!isPDF && !isImage && (
            <div className="flex items-center justify-center h-[400px] text-gray-500">
              Preview not available for this file type
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => onDownload(document)}>
            Download
          </Button>
        </div>
      </div>
    </Modal>
  );
}
