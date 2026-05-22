import { z } from 'zod';
import { DocumentType } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

export const documentUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, 'File size must be less than 10MB')
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      'Only PDF, JPG, and PNG files are accepted'
    ),
  documentType: z.nativeEnum(DocumentType, {
    message: 'Please select a document type',
  }),
});

export type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;
