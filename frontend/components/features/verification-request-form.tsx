'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card';
import { Select, type SelectOption } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import type { Federation, Document } from '@/types';
import { CheckCircle } from 'lucide-react';

const verificationRequestSchema = z.object({
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
  documentIds: z.array(z.string()).min(1, 'Please select at least one document'),
});

type VerificationRequestFormData = z.infer<typeof verificationRequestSchema>;

export interface VerificationRequestFormProps {
  documents: Document[];
  onSubmit: (data: VerificationRequestFormData) => Promise<void>;
}

export const VerificationRequestForm: React.FC<VerificationRequestFormProps> = ({
  documents,
  onSubmit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VerificationRequestFormData>({
    resolver: zodResolver(verificationRequestSchema),
    defaultValues: {
      documentIds: [],
    },
  });

  const handleDocumentToggle = (documentId: string) => {
    const newSelection = selectedDocuments.includes(documentId)
      ? selectedDocuments.filter((id) => id !== documentId)
      : [...selectedDocuments, documentId];
    
    setSelectedDocuments(newSelection);
    setValue('documentIds', newSelection, { shouldValidate: true });
  };

  const handleFormSubmit = async (data: VerificationRequestFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableDocuments = documents.filter(doc => doc.status === 'AVAILABLE');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Verification</CardTitle>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <Textarea
            label="Purpose of Verification"
            placeholder="Describe why you need this verification (e.g., competition registration, club membership, etc.)"
            error={errors.purpose?.message}
            disabled={isSubmitting}
            required
            showCharCount
            maxLength={500}
            rows={4}
            {...register('purpose')}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Attach Documents <span className="text-red-500">*</span>
            </label>
            {availableDocuments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No documents available. Please upload documents first.
              </p>
            ) : (
              <div className="space-y-2">
                {availableDocuments.map((doc) => (
                  <label
                    key={doc.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(doc.id)}
                      onChange={() => handleDocumentToggle(doc.id)}
                      disabled={isSubmitting}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {doc.originalFileName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {doc.documentType.replace(/_/g, ' ')}
                      </p>
                    </div>
                    {selectedDocuments.includes(doc.id) && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </label>
                ))}
              </div>
            )}
            {errors.documentIds && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.documentIds.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting || availableDocuments.length === 0}
            >
              Submit Request
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};
