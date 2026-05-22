'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  requestId?: string;
}

export function RejectionModal({ isOpen, onClose, onConfirm, requestId }: RejectionModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    onConfirm(reason.trim());
    setReason('');
    setError('');
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reject Verification Request"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please provide a reason for rejecting this verification request. This will be shared with the athlete.
        </p>

        {requestId && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Request ID: {requestId}
            </p>
          </div>
        )}

        <Textarea
          label="Rejection Reason"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError('');
          }}
          placeholder="Explain why this request is being rejected..."
          rows={5}
          error={error}
          required
        />

        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            Note: This action cannot be undone. The athlete will be notified of the rejection.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={!reason.trim()}
          >
            Confirm Rejection
          </Button>
        </div>
      </div>
    </Modal>
  );
}
