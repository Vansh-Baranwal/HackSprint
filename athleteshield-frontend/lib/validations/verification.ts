import { z } from 'zod';

export const verificationRequestSchema = z.object({
  federationId: z.string().min(1, 'Please select a federation'),
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
  requestedClaims: z.record(z.any()),
  documentIds: z.array(z.string()).min(1, 'Please attach at least one document'),
});

export type VerificationRequestFormData = z.infer<typeof verificationRequestSchema>;

export const verificationRejectionSchema = z.object({
  reason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
});

export type VerificationRejectionFormData = z.infer<typeof verificationRejectionSchema>;
